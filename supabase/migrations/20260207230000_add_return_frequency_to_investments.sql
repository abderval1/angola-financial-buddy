-- Add return_frequency field to investments table
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS return_frequency TEXT DEFAULT 'annual' CHECK (return_frequency IN ('monthly', 'annual'));

-- Update existing records to have annual as default
UPDATE public.investments SET return_frequency = 'annual' WHERE return_frequency IS NULL;
