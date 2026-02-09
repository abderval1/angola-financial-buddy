-- Migration to update plan features naming for consistency
-- Replace 'Tudo do Plano Gratuito' with 'Tudo do Plano Básico' in all plans

UPDATE public.subscription_plans
SET features = ARRAY_REPLACE(features, 'Tudo do Plano Gratuito', 'Tudo do Plano Básico')
WHERE 'Tudo do Plano Gratuito' = ANY(features);

-- Also ensure the Básico plan itself has the correct name if missed
UPDATE public.subscription_plans
SET name = 'Básico',
    price = 2000,
    trial_period_days = 7
WHERE module_key = 'basic';
