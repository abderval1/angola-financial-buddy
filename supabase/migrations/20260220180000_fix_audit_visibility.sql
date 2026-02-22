-- 0. Cleanup ALL old variations to avoid any ambiguity
DROP FUNCTION IF EXISTS public.get_activity_logs(BOOLEAN);
DROP FUNCTION IF EXISTS public.get_activity_logs(BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS public.get_activity_logs_count(BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS public.get_audit_logs(BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS public.get_audit_logs_count(BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS public.is_admin();

-- 1. Helper function to check if user is admin (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    );
END;
$$;

-- 2. New secure RPC to get activity logs count
CREATE OR REPLACE FUNCTION public.get_audit_logs_count(
    p_is_admin BOOLEAN DEFAULT FALSE,
    p_action_filter TEXT DEFAULT 'all'
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count BIGINT;
BEGIN
    IF p_is_admin AND public.is_admin() THEN
        IF p_action_filter = 'all' THEN
            SELECT count(*) INTO v_count FROM activity_logs;
        ELSE
            SELECT count(*) INTO v_count FROM activity_logs WHERE action = p_action_filter;
        END IF;
    ELSE
        -- Return only own logs count for non-admins
        IF p_action_filter = 'all' THEN
            SELECT count(*) INTO v_count FROM activity_logs WHERE user_id = auth.uid();
        ELSE
            SELECT count(*) INTO v_count FROM activity_logs WHERE user_id = auth.uid() AND action = p_action_filter;
        END IF;
    END IF;
    
    RETURN v_count;
END;
$$;

-- 3. New secure RPC to get paginated logs
CREATE OR REPLACE FUNCTION public.get_audit_logs(
    p_is_admin BOOLEAN DEFAULT FALSE,
    p_action_filter TEXT DEFAULT 'all'
)
RETURNS SETOF activity_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Double check admin status if requested
  IF p_is_admin AND public.is_admin() THEN
    IF p_action_filter = 'all' THEN
        RETURN QUERY SELECT * FROM activity_logs ORDER BY created_at DESC;
    ELSE
        RETURN QUERY SELECT * FROM activity_logs WHERE action = p_action_filter ORDER BY created_at DESC;
    END IF;
  ELSE
    -- Otherwise return only user's own logs
    IF p_action_filter = 'all' THEN
        RETURN QUERY SELECT * FROM activity_logs 
        WHERE user_id = auth.uid() 
        ORDER BY created_at DESC;
    ELSE
        RETURN QUERY SELECT * FROM activity_logs 
        WHERE user_id = auth.uid() AND action = p_action_filter
        ORDER BY created_at DESC;
    END IF;
  END IF;
END;
$$;

-- Grant permissions explicitly
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_audit_logs_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_audit_logs TO authenticated;

-- Force schema cache reload (optional but helps in some setups)
NOTIFY pgrst, 'reload schema';
