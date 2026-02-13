-- Fix column lengths in profiles table to prevent "Data too long" errors
ALTER TABLE public.profiles 
ALTER COLUMN name TYPE TEXT,
ALTER COLUMN email TYPE TEXT,
ALTER COLUMN phone TYPE TEXT,
ALTER COLUMN language TYPE TEXT,
ALTER COLUMN currency TYPE TEXT;

-- Ensure these columns have correct defaults if they were just altered
ALTER TABLE public.profiles 
ALTER COLUMN language SET DEFAULT 'pt',
ALTER COLUMN currency SET DEFAULT 'AOA';
