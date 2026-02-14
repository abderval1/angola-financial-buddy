-- Add missing mfa_check RPC function
-- This function checks if the current user has 2FA enabled

-- RPC: Check if user has 2FA enabled
CREATE OR REPLACE FUNCTION public.mfa_check()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_is_enabled BOOLEAN;
BEGIN
    IF v_user_id IS NULL THEN 
        RETURN jsonb_build_object('enabled', false);
    END IF;

    SELECT is_enabled INTO v_is_enabled
    FROM public.user_2fa 
    WHERE user_id = v_user_id;

    RETURN jsonb_build_object('enabled', COALESCE(v_is_enabled, false));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
