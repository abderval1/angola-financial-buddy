-- Add missing values to business_type enum
ALTER TYPE public.business_type ADD VALUE IF NOT EXISTS 'bico';
ALTER TYPE public.business_type ADD VALUE IF NOT EXISTS 'micro_business';
ALTER TYPE public.business_type ADD VALUE IF NOT EXISTS 'business';

-- Add missing columns to income_sources
ALTER TABLE public.income_sources 
ADD COLUMN IF NOT EXISTS hours_per_week NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS income_type TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS scalability TEXT DEFAULT 'non_scalable',
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'low',
ADD COLUMN IF NOT EXISTS risk_type TEXT DEFAULT 'financial',
ADD COLUMN IF NOT EXISTS growth_potential TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS seasonality TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS investment_type TEXT,
ADD COLUMN IF NOT EXISTS action_recommendation TEXT DEFAULT 'maintain';
