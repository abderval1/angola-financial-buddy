-- Create a function to make a user an admin (only for initial setup)
-- This should be called once to set up the first admin

-- First, let's check if we need to create any admin setup
-- We'll create a simple way to promote the first user to admin via SQL

-- Update RLS policy for user_roles to allow admins to manage all roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Allow users to view their own roles (already exists but let's make sure)
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Create a function that admins can call to promote users
CREATE OR REPLACE FUNCTION public.promote_to_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can promote users';
  END IF;
  
  -- Insert or update the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN true;
END;
$$;

-- Create a function that admins can call to demote users
CREATE OR REPLACE FUNCTION public.demote_from_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can demote users';
  END IF;
  
  -- Delete the admin role (but keep user role if exists)
  DELETE FROM public.user_roles 
  WHERE user_id = target_user_id AND role = 'admin';
  
  RETURN true;
END;
$$;