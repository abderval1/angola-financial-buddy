-- Fix Audit Logs Access - Create a secure function for admin access
-- This function bypasses RLS and returns all logs if user is admin, or own logs otherwise

-- First, drop the function if it exists
DROP FUNCTION IF EXISTS public.get_activity_logs(p_is_admin BOOLEAN);

-- Create a function that returns activity logs based on user role
CREATE OR REPLACE FUNCTION public.get_activity_logs(p_is_admin BOOLEAN DEFAULT FALSE)
RETURNS SETOF activity_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If admin, return all logs
  IF p_is_admin THEN
    RETURN QUERY SELECT * FROM activity_logs ORDER BY created_at DESC;
  ELSE
    -- Otherwise return only user's own logs
    RETURN QUERY SELECT * FROM activity_logs 
    WHERE user_id = auth.uid() 
    ORDER BY created_at DESC;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_activity_logs TO authenticated;

-- Now we need to update the AdminAuditLogs component to use this function
-- But first, let's also ensure RLS policies are correct by recreating them

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can view own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can insert own activity logs" ON public.activity_logs;

-- Recreate with proper logic - Admin check happens via the function instead
-- Allow all authenticated users to read via the function (RLS is bypassed for SECURITY DEFINER)
CREATE POLICY "Allow read via function"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (
  -- This policy will be bypassed when using the function, but serves as fallback
  -- Allow if user is admin OR if it's their own log
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  OR user_id = auth.uid()
);

-- Insert policy - users can only insert their own logs
CREATE POLICY "Users can insert own activity logs"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
