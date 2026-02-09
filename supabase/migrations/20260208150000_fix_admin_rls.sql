-- Fix Admin RLS Policies

-- 1. Ensure `profiles` is readable by admins
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin')
);

-- 2. Ensure `profiles` is editable by admins (status, etc)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin')
);

-- 3. Ensure `user_roles` is readable/writable by admins
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin')
);

-- 4. Ensure `user_gamification` is readable/writable by admins
DROP POLICY IF EXISTS "Admins can manage gamification" ON public.user_gamification;
CREATE POLICY "Admins can manage gamification"
ON public.user_gamification
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin')
);
