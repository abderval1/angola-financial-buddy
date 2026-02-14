-- Fix: Add inline TOTP validation to mfa_verify_and_enable
-- This ensures validation works even if validate_totp has issues

CREATE OR REPLACE FUNCTION public.mfa_verify_and_enable(p_code TEXT, p_secret TEXT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_backup_codes JSONB;
    v_code TEXT;
    v_key BYTEA;
    v_timestamp BIGINT := floor(extract(epoch from now()) / 30);
    v_counter BYTEA;
    v_hmac BYTEA;
    v_offset INTEGER;
    v_otp_val INTEGER;
    v_check_code TEXT;
    v_step BIGINT;
    v_valid BOOLEAN := false;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    
    -- Inline TOTP Validation (not calling validate_totp)
    IF p_code IS NOT NULL AND p_secret IS NOT NULL AND length(p_secret) >= 16 AND length(p_code) = 6 THEN
        BEGIN
            v_key := public.base32_decode(p_secret);
            IF v_key IS NOT NULL AND length(v_key) > 0 THEN
                FOR v_step IN (v_timestamp - 1)..(v_timestamp + 1) LOOP
                    v_counter := decode(lpad(to_hex(v_step), 16, '0'), 'hex');
                    v_hmac := hmac(v_counter, v_key, 'sha1');
                    v_offset := (get_byte(v_hmac, 19) & 15) + 1;
                    v_otp_val := ((get_byte(v_hmac, v_offset - 1) & 127) << 24) |
                                 (get_byte(v_hmac, v_offset) << 16) |
                                 (get_byte(v_hmac, v_offset + 1) << 8) |
                                 (get_byte(v_hmac, v_offset + 2));
                    v_check_code := lpad((v_otp_val % 1000000)::text, 6, '0');
                    IF v_check_code = p_code THEN
                        v_valid := true;
                        EXIT;
                    END IF;
                END LOOP;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_valid := false;
        END;
    END IF;
    
    IF NOT v_valid THEN
        RAISE EXCEPTION 'Código de verificação inválido';
    END IF;
    
    -- Generate 8 backup codes
    v_backup_codes := '[]'::jsonb;
    FOR i IN 1..8 LOOP
        v_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
        v_backup_codes := v_backup_codes || jsonb_build_array(v_code);
    END LOOP;

    INSERT INTO public.user_2fa (user_id, totp_secret, is_enabled, backup_codes)
    VALUES (v_user_id, p_secret, true, v_backup_codes)
    ON CONFLICT (user_id) DO UPDATE
    SET totp_secret = p_secret, is_enabled = true, backup_codes = v_backup_codes, updated_at = NOW();

    RETURN jsonb_build_object('success', true, 'backupCodes', v_backup_codes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
