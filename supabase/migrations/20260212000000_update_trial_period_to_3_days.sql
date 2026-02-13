-- Migration to update trial period from 7 to 3 days
UPDATE subscription_plans 
SET trial_period_days = 3 
WHERE trial_period_days = 7;
