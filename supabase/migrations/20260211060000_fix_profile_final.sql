-- Final Profile Schema and RLS Alignment
-- Ensure all columns exist and RLS is unambiguous

-- 1. Ensure columns exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt',
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'AOA',
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Ensure notification_preferences is JSONB and has default
ALTER TABLE public.profiles 
ALTER COLUMN notification_preferences SET DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb;

-- 3. Fix RLS - Drop all old policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- SELECT: Anyone authenticated can see any profile (for community/chat)
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- UPDATE: Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- INSERT: Anyone authenticated can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Improve RPC: Admin Update User Profile (to handle missing records)
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

    -- Upsert logic
    INSERT INTO public.profiles (user_id, name, phone, language, currency, updated_at)
    VALUES (target_user_id, new_name, new_phone, COALESCE(new_language, 'pt'), COALESCE(new_currency, 'AOA'), NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET 
        name = COALESCE(new_name, public.profiles.name),
        phone = COALESCE(new_phone, public.profiles.phone),
        language = COALESCE(new_language, public.profiles.language),
        currency = COALESCE(new_currency, public.profiles.currency),
        updated_at = NOW();
END;
$$;

-- 5. Ensure a trigger for updated_at exists or is working
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
            CREATE TRIGGER update_profiles_updated_at 
            BEFORE UPDATE ON public.profiles 
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
        END IF;
    END IF;
END $$;
