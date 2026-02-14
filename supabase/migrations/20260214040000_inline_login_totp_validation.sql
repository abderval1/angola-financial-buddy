-- Fix: Add inline TOTP validation to mfa_login_verify
-- This ensures login verification works properly

CREATE OR REPLACE FUNCTION public.mfa_login_verify(p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_secret TEXT;
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
    
    -- Get user's TOTP secret
    SELECT totp_secret INTO v_secret FROM public.user_2fa WHERE user_id = v_user_id AND is_enabled = true;
    
    IF v_secret IS NULL THEN
        RAISE EXCEPTION '2FA não está configurado';
    END IF;
    
    -- Inline TOTP Validation
    BEGIN
        v_key := public.base32_decode(v_secret);
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
    
    IF NOT v_valid THEN
        RAISE EXCEPTION 'Código de verificação inválido';
    END IF;
    
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
