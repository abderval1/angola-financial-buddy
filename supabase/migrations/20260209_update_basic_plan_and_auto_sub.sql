-- Migration to update the Free Plan to a paid Basic Plan with a 7-day trial
-- Requirement: "Plano gratuito, so é gratis durante 7 dias depois do registo, mas depois ele deve pagar 2.000 kzs mensal"

-- 1. Update the 'Gratuito' plan to 'Básico' with price 2000 and 7 days trial
UPDATE public.subscription_plans
SET 
  name = 'Básico',
  price = 2000,
  trial_period_days = 7
WHERE name = 'Gratuito' OR module_key = 'basic';

-- Also ensure 'Iniciante' (if it exists) doesn't conflict or is aligned
-- The previous migration added 'Iniciante' with price 2000 and trial 7 for 'education' module.
-- Let's make sure the 'basic' module follows this too if it's the one used for the dashboard.

-- 2. Create a function to automatically subscribe new users to the Básico plan trial
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_id UUID;
BEGIN
  -- Get the ID of the 'Básico' plan
  SELECT id INTO v_plan_id FROM public.subscription_plans WHERE module_key = 'basic' LIMIT 1;
  
  IF v_plan_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (user_id, plan_id, status, is_trial, expires_at)
    VALUES (
      NEW.id, 
      v_plan_id, 
      'active', 
      true, 
      NOW() + INTERVAL '7 days'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger on auth.users (via profiles since we can't easily trigger auth directly in some setups, but better yet, use the profiles trigger if exists)
-- Actually, there's usually a trigger that creates a profile. We can add more logic to that or create a new one.
-- Let's check if there's already a trigger on auth.users.
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();
