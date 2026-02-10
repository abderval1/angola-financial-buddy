-- EMERGENCY FIX: Restore Access & Fix Recursion

-- 1. Drop the problematic recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- 2. Allow ALL authenticated users to read user_roles (Breaks recursion)
-- This is safe: knowing someone's role is generally low risk, and it allows the admin check to work.
CREATE POLICY "Allow read access to user_roles for authenticated users"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- 3. Allow Admins to INSERT/UPDATE/DELETE user_roles
-- Now we can safely check role='admin' because the SELECT policy above allows reading the table.
CREATE POLICY "Admins can manage user_roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- 4. Restore Admin access to Profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- 5. Restore User access to their own profile (in case it was affected)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);
