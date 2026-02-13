-- Migration: Add budget_config to financial_profiles for user customization

ALTER TABLE public.financial_profiles 
ADD COLUMN IF NOT EXISTS budget_config JSONB DEFAULT '{
    "savings_goal_pct": 20,
    "needs_limit_pct": 50,
    "wants_limit_pct": 30
}'::jsonb;

-- Comment on column
COMMENT ON COLUMN public.financial_profiles.budget_config IS 'Stores user-specific budget settings like target savings percentage.';
