-- Admin User CRUD Extensions

-- 1. RPC: Admin Delete User
-- This function allows an admin to delete a user's profile and associated data.
-- Note: Deleting from auth.users requires elevated privileges or a specific setup.
-- Since we are using SECURITY DEFINER, and based on the profiles table having ON DELETE CASCADE,
-- deleting the profile will handle most things, but we want to actually delete from auth.users if possible.
-- However, standard RPCs cannot delete from auth.users easily without bypass or edge functions.
-- As a compromise, we will delete the profile and associated data, and if the user wants to truly delete from auth,
-- they would usually need a more complex setup or use the Supabase dashboard.
-- BUT, we can try to use the admin API if we were in an edge function.
-- In a SQL RPC, we can only touch public/other schemas.
-- Let's implement a "Nuclear" delete for profile and data.

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
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
        RAISE EXCEPTION 'Access denied. Only admins can delete users.';
    END IF;

    -- Delete from profiles (this should cascade if configured, but let's be explicit for safety)
    -- Profiles table has ON DELETE CASCADE on user_id REFERENCES auth.users(id)
    -- So we actually need to delete the user from auth.users to truly delete everything.
    -- SQL RPCs don't have permission to DELETE FROM auth.users directly unless they are superuser.
    
    -- If we can't delete from auth.users, we can at least wipe the profile and mark as inactive.
    -- But the request asks for CRUD, which implies deletion.
    
    -- Let's try to delete from public tables first.
    DELETE FROM public.profiles WHERE user_id = target_user_id;
    DELETE FROM public.user_roles WHERE user_id = target_user_id;
    -- Other tables also have ON DELETE CASCADE usually.
END;
$$;

-- 2. RPC: Admin Update User Profile
CREATE OR REPLACE FUNCTION public.admin_update_user(
    target_user_id UUID,
    new_name TEXT DEFAULT NULL,
    new_phone TEXT DEFAULT NULL,
    new_language TEXT DEFAULT NULL,
    new_currency TEXT DEFAULT NULL
)
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
        RAISE EXCEPTION 'Access denied. Only admins can update user profiles.';
    END IF;

    UPDATE public.profiles
    SET 
        name = COALESCE(new_name, name),
        phone = COALESCE(new_phone, phone),
        language = COALESCE(new_language, language),
        currency = COALESCE(new_currency, currency),
        updated_at = NOW()
    WHERE user_id = target_user_id;
END;
$$;
