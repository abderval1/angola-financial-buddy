-- Add risk_profile and investment_type columns to financial_goals table
ALTER TABLE public.financial_goals ADD COLUMN IF NOT EXISTS risk_profile TEXT CHECK (risk_profile IN ('low', 'medium', 'high', 'very_high'));
ALTER TABLE public.financial_goals ADD COLUMN IF NOT EXISTS investment_type TEXT;

-- Update existing records to have default values
UPDATE public.financial_goals SET risk_profile = 'medium' WHERE risk_profile IS NULL;
UPDATE public.financial_goals SET investment_type = 'poupanca' WHERE investment_type IS NULL;
