-- Fix Plan Tiers to match Access Control Logic
-- Básico (Tier 1)
-- Essencial (Tier 2) -> Required for Metas & FIRE
-- Pro (Tier 3) -> Required for Education
-- Avançado (Tier 4) -> Required for News/Reports

BEGIN;

-- 1. Update Essencial to Tier 2
UPDATE subscription_plans
SET tier_level = 2
WHERE name = 'Essencial' OR module_key = 'metas_fire';

-- 2. Update Pro to Tier 3
UPDATE subscription_plans
SET tier_level = 3
WHERE name = 'Pro' OR module_key = 'education';

-- 3. Update Avançado to Tier 4
UPDATE subscription_plans
SET tier_level = 4
WHERE name = 'Avançado' OR module_key = 'news';

-- 4. Ensure Básico is Tier 1
UPDATE subscription_plans
SET tier_level = 1
WHERE name = 'Básico' OR module_key = 'basic';

COMMIT;
