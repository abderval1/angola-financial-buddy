-- SUPER FIX: Restore Admin Access & Fix Recursion
-- Run this in Supabase SQL Editor

-- 1. Drop ALL potential conflicting policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow read access to user_roles for authenticated users" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- 2. Create the SAFE read policy for roles (Breaks recursion)
CREATE POLICY "Allow read access to user_roles for authenticated users"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- 3. Create the Admin management policy for roles
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

-- 5. Restore User access to their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- 6. EMERGENCY: Force user to be admin (Replace 'seu-email@exemplo.com' if needed)
-- This logic tries to find your user by email and FORCE the role to 'admin'
-- If you are not sure if you are admin, run this block:

DO $$
DECLARE
    v_user_email text := 'admin@angolafinance.com'; -- SUBSTITUA PELO SEU EMAIL AQUI
    v_user_id uuid;
BEGIN
    -- Busca o ID do usuário pelo email
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;
    
    IF v_user_id IS NOT NULL THEN
        -- Remove role existente para evitar duplicidade (se for unique)
        DELETE FROM public.user_roles WHERE user_id = v_user_id;
        -- Insere como admin
        INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin');
    END IF;
END $$;
