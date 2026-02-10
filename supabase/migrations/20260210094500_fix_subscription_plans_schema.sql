-- Add missing columns to subscription_plans table
DO $$
BEGIN
    -- Add tier_level if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'tier_level') THEN
        ALTER TABLE public.subscription_plans ADD COLUMN tier_level INTEGER DEFAULT 0;
    END IF;

    -- Add module_key if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'module_key') THEN
        ALTER TABLE public.subscription_plans ADD COLUMN module_key TEXT;
    END IF;

    -- Add trial_period_days if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'trial_period_days') THEN
        ALTER TABLE public.subscription_plans ADD COLUMN trial_period_days INTEGER DEFAULT 0;
    END IF;
    
    -- Add ebook_limit if it doesn't exist
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'ebook_limit') THEN
        ALTER TABLE public.subscription_plans ADD COLUMN ebook_limit INTEGER DEFAULT 0;
    END IF;
END $$;

-- Now update the Basic plan
UPDATE public.subscription_plans 
SET tier_level = 0, 
    module_key = 'basic',
    price = 2000,
    trial_period_days = 7
WHERE name = 'Básico' OR name = 'Gratuito';
