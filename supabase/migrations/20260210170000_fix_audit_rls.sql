-- Fix Audit Logs RLS
-- This script drops and recreates policies to ensure Admin access

DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can view own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can insert own activity logs" ON public.activity_logs;

-- Re-enable RLS just in case
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 1. Insert Policy (Authenticated users can insert)
CREATE POLICY "Users can insert own activity logs"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Select Policy (Admins can view all)
-- We use a simpler check or rely on a security definer function if needed, 
-- but let's try direct policy again with a specific cast just in case.
-- Also ensure the subquery is correct.
CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- 3. Select Policy (Users can view own)
CREATE POLICY "Users can view own activity logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Grant permissions just in case
GRANT ALL ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
