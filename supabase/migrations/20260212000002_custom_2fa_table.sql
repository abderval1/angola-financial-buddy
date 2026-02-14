-- Custom 2FA Architecture using RPC (PL/pgSQL)
-- This implementation handles TOTP (RFC 6238) directly in the database

-- 0. Enable pgcrypto for HMAC and hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Table for 2FA storage
CREATE TABLE IF NOT EXISTS public.user_2fa (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    totp_secret TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    backup_codes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

-- Policies: Users can see if they have 2FA enabled, but NEVER the secret directly
CREATE POLICY "Users can view their own 2FA status" ON public.user_2fa
    FOR SELECT USING (auth.uid() = user_id);

-- 2. Helper Function: Generate Random Base32 Secret
CREATE OR REPLACE FUNCTION public.generate_totp_secret()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..32 LOOP
        result := result || substr(chars, floor(random() * 32)::int + 1, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 3. RPC: Setup or Reset 2FA (Returns Secret and URI)
CREATE OR REPLACE FUNCTION public.mfa_setup()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_user_email TEXT;
    v_secret TEXT;
    v_uri TEXT;
    v_issuer TEXT := 'AngolaFinance';
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    v_secret := public.generate_totp_secret();
    v_uri := 'otpauth://totp/' || v_issuer || ':' || v_user_email || '?secret=' || v_secret || '&issuer=' || v_issuer;

    RETURN jsonb_build_object(
        'secret', v_secret,
        'qrUri', v_uri
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Helper: Base32 Decode to Bytea
CREATE OR REPLACE FUNCTION public.base32_decode(p_base32_string TEXT)
RETURNS BYTEA AS $$
DECLARE
    v_alphabet TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    v_clean_string TEXT := upper(replace(p_base32_string, '=', ''));
    v_bytea BYTEA := '\x'::bytea;
    v_buffer BIGINT := 0;
    v_bits_in_buffer INTEGER := 0;
    v_char_val INTEGER;
    i INTEGER;
BEGIN
    FOR i IN 1..length(v_clean_string) LOOP
        v_char_val := strpos(v_alphabet, substr(v_clean_string, i, 1)) - 1;
        IF v_char_val < 0 THEN CONTINUE; END IF;
        v_buffer := (v_buffer << 5) | v_char_val;
        v_bits_in_buffer := v_bits_in_buffer + 5;
        IF v_bits_in_buffer >= 8 THEN
            v_bytea := v_bytea || set_byte('\x00'::bytea, 0, ((v_buffer >> (v_bits_in_buffer - 8)) & 255)::int);
            v_bits_in_buffer := v_bits_in_buffer - 8;
        END IF;
    END LOOP;
    RETURN v_bytea;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Helper: Validate TOTP
CREATE OR REPLACE FUNCTION public.validate_totp(p_secret TEXT, p_code TEXT)
RETURNS BOOLEAN AS $
DECLARE
    v_key BYTEA;
    v_timestamp BIGINT := floor(extract(epoch from now()) / 30);
    v_counter BYTEA;
    v_hmac BYTEA;
    v_offset INTEGER;
    v_otp_val INTEGER;
    v_check_code TEXT;
    v_step BIGINT;
BEGIN
    -- Validate inputs
    IF p_secret IS NULL OR p_code IS NULL OR length(p_secret) < 16 THEN
        RETURN false;
    END IF;
    
    -- Validate code format (must be 6 digits)
    IF length(p_code) != 6 OR p_code !~ '^[0-9]{6}

-- 6. RPC: Verify and Enable 2FA
CREATE OR REPLACE FUNCTION public.mfa_verify_and_enable(p_code TEXT, p_secret TEXT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_backup_codes JSONB;
    v_code TEXT;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Validate TOTP Code
    IF NOT public.validate_totp(p_secret, p_code) THEN
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

-- 7. RPC: Login Verification
CREATE OR REPLACE FUNCTION public.mfa_login_verify(p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_secret TEXT;
    v_backups JSONB;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT totp_secret, backup_codes INTO v_secret, v_backups
    FROM public.user_2fa WHERE user_id = v_user_id AND is_enabled = true;

    IF v_secret IS NULL THEN RAISE EXCEPTION '2FA not enabled'; END IF;

    -- Check TOTP
    IF public.validate_totp(v_secret, p_code) THEN
        RETURN jsonb_build_object('success', true);
    END IF;

    -- Check Backup Codes (supports either array logic or ? operator if valid)
    IF v_backups ? upper(p_code) THEN
        UPDATE public.user_2fa 
        SET backup_codes = backup_codes - upper(p_code)
        WHERE user_id = v_user_id;
        RETURN jsonb_build_object('success', true, 'message', 'Backup code used');
    END IF;

    RETURN jsonb_build_object('success', false, 'error', 'Invalid code');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RPC: Disable
CREATE OR REPLACE FUNCTION public.mfa_disable(p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_secret TEXT;
BEGIN
    SELECT totp_secret INTO v_secret FROM public.user_2fa WHERE user_id = v_user_id;
    
    IF v_secret IS NOT NULL AND NOT public.validate_totp(v_secret, p_code) THEN
        RAISE EXCEPTION 'Código inválido para desactivação';
    END IF;

    DELETE FROM public.user_2fa WHERE user_id = v_user_id;
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
 THEN
        RETURN false;
    END IF;
    
    -- Try to decode the secret
    BEGIN
        v_key := public.base32_decode(p_secret);
    EXCEPTION WHEN OTHERS THEN
        RETURN false;
    END;
    
    IF v_key IS NULL OR length(v_key) = 0 THEN
        RETURN false;
    END IF;
    
    -- Check 3 time windows (current, previous, next) to account for slight clock drift
    FOR v_step IN (v_timestamp - 1)..(v_timestamp + 1) LOOP
        -- Convert timestamp to 8-byte big-endian bytea
        v_counter := decode(lpad(to_hex(v_step), 16, '0'), 'hex');
        
        -- HMAC-SHA1
        v_hmac := hmac(v_counter, v_key, 'sha1');
        
        -- Dynamic Truncation
        v_offset := (get_byte(v_hmac, 19) & 15) + 1;
        v_otp_val := ((get_byte(v_hmac, v_offset - 1) & 127) << 24) |
                     (get_byte(v_hmac, v_offset) << 16) |
                     (get_byte(v_hmac, v_offset + 1) << 8) |
                     (get_byte(v_hmac, v_offset + 2));
        
        v_check_code := lpad((v_otp_val % 1000000)::text, 6, '0');
        
        IF v_check_code = p_code THEN
            RETURN true;
        END IF;
    END LOOP;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. RPC: Verify and Enable 2FA
CREATE OR REPLACE FUNCTION public.mfa_verify_and_enable(p_code TEXT, p_secret TEXT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_backup_codes JSONB;
    v_code TEXT;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Validate TOTP Code
    IF NOT public.validate_totp(p_secret, p_code) THEN
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

-- 7. RPC: Login Verification
CREATE OR REPLACE FUNCTION public.mfa_login_verify(p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_secret TEXT;
    v_backups JSONB;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT totp_secret, backup_codes INTO v_secret, v_backups
    FROM public.user_2fa WHERE user_id = v_user_id AND is_enabled = true;

    IF v_secret IS NULL THEN RAISE EXCEPTION '2FA not enabled'; END IF;

    -- Check TOTP
    IF public.validate_totp(v_secret, p_code) THEN
        RETURN jsonb_build_object('success', true);
    END IF;

    -- Check Backup Codes (supports either array logic or ? operator if valid)
    IF v_backups ? upper(p_code) THEN
        UPDATE public.user_2fa 
        SET backup_codes = backup_codes - upper(p_code)
        WHERE user_id = v_user_id;
        RETURN jsonb_build_object('success', true, 'message', 'Backup code used');
    END IF;

    RETURN jsonb_build_object('success', false, 'error', 'Invalid code');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RPC: Disable
CREATE OR REPLACE FUNCTION public.mfa_disable(p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_secret TEXT;
BEGIN
    SELECT totp_secret INTO v_secret FROM public.user_2fa WHERE user_id = v_user_id;
    
    IF v_secret IS NOT NULL AND NOT public.validate_totp(v_secret, p_code) THEN
        RAISE EXCEPTION 'Código inválido para desactivação';
    END IF;

    DELETE FROM public.user_2fa WHERE user_id = v_user_id;
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
