-- Final Profile RLS and Schema Alignment
-- This migration ensures users can fully manage their own profiles.

-- 1. Ensure basic policies exist and are correct
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- SELECT: Users can see their own profile + Authenticated users can see others (for chat)
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

-- INSERT: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Ensure monthly_budget exists (it should, but just in case)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS monthly_budget NUMERIC(12,2) DEFAULT 0;

-- 3. Sync names if necessary (Ensuring 'name' is the main field)
-- The UI uses 'name', schema has 'name'. Some legacy migrations mentioned 'full_name'.
-- Adding 'full_name' as an alias or ensuring it exists doesn't hurt, but 'name' is primary.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Update full_name to name if empty for backward compatibility
UPDATE public.profiles SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;
