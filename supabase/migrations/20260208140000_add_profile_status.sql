-- Add status column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned'));

-- Update existing profiles to active
UPDATE public.profiles SET status = 'active' WHERE status IS NULL;
