-- Fix: Ensure base32_decode is working properly
-- This is a critical helper function for TOTP validation

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
    -- Handle empty or NULL input
    IF p_base32_string IS NULL OR length(p_base32_string) = 0 THEN
        RETURN NULL;
    END IF;
    
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

-- Also fix generate_totp_secret to ensure proper padding
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
