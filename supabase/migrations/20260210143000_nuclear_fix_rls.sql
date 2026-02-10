-- DEBUG & FIX RLS "NUCLEAR OPTION"
-- Run this in Supabase SQL Editor

-- 1. Ensure RLS is enabled (it should be, but let's be sure)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL policies on user_roles (Clean slate)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow read access to user_roles for authenticated users" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "public_read" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_roles;

-- 3. Create a SINGLE, SIMPLE policy for reading user_roles
-- This allows ANY authenticated user to read ANY row in user_roles.
-- This is necessary so the client can say "Hey, am I an admin?"
CREATE POLICY "Enable read access for all users"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- 4. Create a policy for Admins to INSERT/UPDATE/DELETE
CREATE POLICY "Enable insert for admins only"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Enable update for admins only"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Enable delete for admins only"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- 5. Restore User access to Profiles (so they can see their own name)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- 6. Grant usage on schema public (Just in case permissions were lost)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
