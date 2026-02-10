-- User Management CRUD: Schema & RPCs

-- 1. Add is_active status to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Ensure user_roles CHECK constraint supports 'moderator'
-- First, drop existing constraint if it exists (names vary, so we try to be generic or just alter the type if it's an enum)
-- Assuming 'role' is a text column with a check constraint or just text.
-- Let's add a check constraint if it doesn't exist, or replace it.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_role_check') THEN
        ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_role_check;
    END IF;
END $$;

ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_role_check 
CHECK (role IN ('admin', 'moderator', 'user'));

-- 3. RPC: Toggle User Status
CREATE OR REPLACE FUNCTION public.toggle_user_status(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_status BOOLEAN;
    new_status BOOLEAN;
BEGIN
    -- Check if executor is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Only admins can manage user status.';
    END IF;

    -- Get current status
    SELECT is_active INTO current_status FROM public.profiles WHERE user_id = target_user_id;
    
    -- Toggle
    new_status := NOT COALESCE(current_status, true); -- Default to true if null, so new is false
    
    UPDATE public.profiles
    SET is_active = new_status
    WHERE user_id = target_user_id;
    
    RETURN new_status;
END;
$$;

-- 4. RPC: Set User Role
CREATE OR REPLACE FUNCTION public.set_user_role(target_user_id UUID, new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if executor is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Only admins can manage roles.';
    END IF;

    -- Validate role
    IF new_role NOT IN ('admin', 'moderator', 'user') THEN
        RAISE EXCEPTION 'Invalid role.';
    END IF;

    -- Upsert role
    -- If role is 'user', we might want to just delete the entry if we want to save space, 
    -- OR keep it as 'user'. Let's keep it explicit.
    
    DELETE FROM public.user_roles WHERE user_id = target_user_id;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, new_role);
END;
$$;

-- 5. Update RLS on Profiles to respect is_active (Optional but recommended)
-- This logic prevents inactive users from reading profiles (and potentially logging in if app checks this)
-- For now, let's just allow admins to read all valid stuff.
