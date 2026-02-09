-- Migration to add trial periods and the Iniciante plan

-- Add trial_period_days to subscription_plans
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS trial_period_days INTEGER DEFAULT 0;

-- Add is_trial and rename/ensure expires_at exists in user_subscriptions
-- expires_at already exists in the table from previous migrations
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false;

-- Add module_key to subscription_plans if it doesn't exist (it should from tiered_subscriptions)
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS module_key VARCHAR UNIQUE;

-- Insert or Update Plans
-- Tier 1: Iniciante (Acesso à Educação)
INSERT INTO public.subscription_plans (name, price, module_key, tier_level, trial_period_days, is_active, features)
VALUES ('Iniciante', 2000, 'education', 1, 7, true, '["Acesso a todo o conteúdo educativo", "2 ebooks grátis por mês", "Suporte da comunidade"]')
ON CONFLICT (module_key) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  tier_level = 1,
  trial_period_days = 7,
  features = EXCLUDED.features;

-- Tier 2: Essencial (Metas & FIRE)
INSERT INTO public.subscription_plans (name, price, module_key, tier_level, is_active, features)
VALUES ('Essencial', 4000, 'metas_fire', 2, true, '["Tudo do Iniciante", "Simulador FIRE", "Gestão de metas pessoais", "Alertas personalizados"]')
ON CONFLICT (module_key) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  tier_level = 2,
  features = EXCLUDED.features;

-- Tier 3: Pro (Conteúdo Premium)
INSERT INTO public.subscription_plans (name, price, module_key, tier_level, is_active, features)
VALUES ('Pro', 8000, 'premium_content', 3, true, '["Tudo do Essencial", "Acesso a todos os cursos premium", "Calculadoras avançadas", "Certificados"]')
ON CONFLICT (module_key) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  tier_level = 3,
  features = EXCLUDED.features;

-- Tier 4: Avançado (Notícias & IA)
INSERT INTO public.subscription_plans (name, price, module_key, tier_level, is_active, features)
VALUES ('Avançado', 12000, 'news', 4, true, '["Tudo do Pro", "Notícias do mercado em tempo real", "Análise de indicadores", "Relatórios semanais"]')
ON CONFLICT (module_key) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  tier_level = 4,
  features = EXCLUDED.features;

-- Update access function to reflect new tiers
CREATE OR REPLACE FUNCTION has_module_access(p_user_id UUID, p_module_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_required_tier INTEGER;
    v_user_max_tier INTEGER;
BEGIN
    -- Define required tiers for modules
    v_required_tier := CASE 
        WHEN p_module_key = 'education' THEN 1
        WHEN p_module_key = 'metas_fire' THEN 2
        WHEN p_module_key = 'premium_content' THEN 3
        WHEN p_module_key = 'news' THEN 4
        ELSE 0
    END;

    -- Get user's highest active tier level
    SELECT MAX(sp.tier_level)
    INTO v_user_max_tier
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id 
    AND us.status = 'active'
    AND (us.expires_at IS NULL OR us.expires_at > NOW());

    RETURN COALESCE(v_user_max_tier, 0) >= v_required_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
