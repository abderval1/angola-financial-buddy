-- Migration: Make transaction categories user-specific and independent

-- 1. Create a helper function to clone default categories for a user
CREATE OR REPLACE FUNCTION public.clone_default_categories(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.transaction_categories (user_id, name, type, icon, color, is_default)
    SELECT target_user_id, name, type, icon, color, FALSE
    FROM public.transaction_categories
    WHERE is_default = TRUE
    AND NOT EXISTS (
        SELECT 1 FROM public.transaction_categories
        WHERE user_id = target_user_id AND name = public.transaction_categories.name AND type = public.transaction_categories.type
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update the new user handler to clone categories automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, name, email)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'name', NEW.email);
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    INSERT INTO public.financial_profiles (user_id)
    VALUES (NEW.id);

    -- Clone default categories for the new user
    PERFORM public.clone_default_categories(NEW.id);
    
    RETURN NEW;
END;
$$;

-- 3. Backfill: Clone categories for ALL existing users
DO $$
DECLARE
    u RECORD;
BEGIN
    FOR u IN SELECT id FROM auth.users LOOP
        PERFORM public.clone_default_categories(u.id);
    END LOOP;
END;
$$;

-- 4. Update RLS Policy to STRICTLY isolate users
-- First drop the old permissive policy
DROP POLICY IF EXISTS "Users can view own categories" ON public.transaction_categories;

-- Create new strict policy (Users can ONLY see rows where user_id matches their ID)
CREATE POLICY "Users can view own categories" ON public.transaction_categories 
FOR SELECT USING (auth.uid() = user_id);

-- Note: The "is_default=TRUE" rows (templates) have user_id=NULL, 
-- so they are now invisible to users, ensuring complete isolation.
