-- Fix: Correct the validate_totp function syntax error
-- The function was created with '$ LANGUAGE' instead of '$$ LANGUAGE'

-- Drop the incorrectly created function if it exists
DROP FUNCTION IF EXISTS public.validate_totp(TEXT, TEXT);

-- Recreate the validate_totp function with correct syntax
CREATE OR REPLACE FUNCTION public.validate_totp(p_secret TEXT, p_code TEXT)
RETURNS BOOLEAN AS $$
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
    IF length(p_code) != 6 OR p_code !~ '^[0-9]{6}$' THEN
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
