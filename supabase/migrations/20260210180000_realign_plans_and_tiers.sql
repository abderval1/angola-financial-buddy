-- Realign plans and tiers according to new requirements
-- Goal: 
-- 1. Básico (2.000 Kz) -> Tier 1 (Module: basic)
-- 2. Essencial (4.000 Kz) -> Tier 2 (Module: metas_fire)
-- 3. Pro (8.000 Kz) -> Tier 3 (Module: education / premium_content)
-- 4. Avançado (12.000 Kz) -> Tier 4 (Module: news)

-- First, ensure module_key column is clean and unique
ALTER TABLE public.subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_module_key_key;
ALTER TABLE public.subscription_plans ADD CONSTRAINT subscription_plans_module_key_key UNIQUE (module_key);

-- Start from a clean slate for these specific tiers
DELETE FROM public.subscription_plans WHERE module_key IN ('basic', 'metas_fire', 'education', 'premium_content', 'news');

-- 1. Básico (Tier 1) - Covers core features
INSERT INTO public.subscription_plans (name, price, module_key, tier_level, trial_period_days, is_active, features, ebook_limit)
VALUES (
    'Básico', 
    2000, 
    'basic', 
    1, 
    7, 
    true, 
    '["Orçamento & Despesas", "Poupança & Dívidas", "Investimentos Básicos", "Comparador Kixikila", "Calculadoras & Renda Extra", "Comunidade & Marketplace"]',
    2
);

-- 2. Essencial (Tier 2) - Metas & FIRE
INSERT INTO public.subscription_plans (name, price, module_key, tier_level, is_active, features, ebook_limit)
VALUES (
    'Essencial', 
    4000, 
    'metas_fire', 
    2, 
    true, 
    '["Tudo do Plano Básico", "Módulo Metas & FIRE", "Simulador de Independência", "Gestão Metas Avançada", "Coach Virtual Personalizado"]',
    5
);

-- 3. Pro (Tier 3) - Education
INSERT INTO public.subscription_plans (name, price, module_key, tier_level, is_active, features, ebook_limit)
VALUES (
    'Pro', 
    8000, 
    'education', 
    3, 
    true, 
    '["Tudo do Plano Essencial", "Módulo de Educação", "Cursos & Certificados", "Calculadoras Premium", "Recursos Exclusivos"]',
    10
);

-- 4. Avançado (Tier 4) - News & Market
INSERT INTO public.subscription_plans (name, price, module_key, tier_level, is_active, features, ebook_limit)
VALUES (
    'Avançado', 
    12000, 
    'news', 
    4, 
    true, 
    '["Tudo do Plano Pro", "Módulo Notícias & Mercado", "Indicadores Económicos", "Relatórios Semanais", "Análise de Tendências"]',
    20
);

-- Update has_module_access function to be robust
CREATE OR REPLACE FUNCTION has_module_access(p_user_id UUID, p_module_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_required_tier INTEGER;
    v_user_max_tier INTEGER;
    v_is_admin BOOLEAN;
BEGIN
    -- Check if user is admin
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = p_user_id AND role = 'admin'
    ) INTO v_is_admin;
    
    IF v_is_admin THEN
        RETURN TRUE;
    END IF;

    -- Define required tiers for modules (matching useModuleAccess.ts)
    v_required_tier := CASE 
        WHEN p_module_key = 'basic' THEN 1
        WHEN p_module_key = 'metas_fire' THEN 2
        WHEN p_module_key = 'education' THEN 3
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
    AND (us.status = 'active' OR us.status = 'trialing')
    AND (us.expires_at IS NULL OR us.expires_at > NOW());

    RETURN COALESCE(v_user_max_tier, 0) >= v_required_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
