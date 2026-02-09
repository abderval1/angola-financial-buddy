-- Migration to support Tiered Subscriptions
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS tier_level INTEGER DEFAULT 0;

-- Update existing plans or insert new ones
-- Tier 1: Essencial (Metas & FIRE)
INSERT INTO subscription_plans (name, price, module_key, tier_level, is_active, features)
VALUES ('Essencial', 4000, 'metas_fire', 1, true, '["Planeamento financeiro completo", "Simulador FIRE", "Gestão de metas pessoais", "Alertas personalizados"]')
ON CONFLICT (module_key) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  tier_level = 1,
  features = EXCLUDED.features;

-- Tier 2: Pro (Essencial + Educação)
INSERT INTO subscription_plans (name, price, module_key, tier_level, is_active, features)
VALUES ('Pro', 8000, 'education', 2, true, '["Tudo do Essencial", "Acesso a todos os cursos", "Calculadoras avançadas", "Certificados de conclusão"]')
ON CONFLICT (module_key) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  tier_level = 2,
  features = EXCLUDED.features;

-- Tier 3: Avançado (Pro + Notícias)
INSERT INTO subscription_plans (name, price, module_key, tier_level, is_active, features)
VALUES ('Avançado', 12000, 'news', 3, true, '["Tudo do Pro", "Notícias do mercado em tempo real", "Análise de indicadores", "Relatórios semanais"]')
ON CONFLICT (module_key) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  tier_level = 3,
  features = EXCLUDED.features;

-- Update access function to be tier-aware
CREATE OR REPLACE FUNCTION has_module_access(p_user_id UUID, p_module_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_required_tier INTEGER;
    v_user_max_tier INTEGER;
BEGIN
    -- Define required tiers for modules
    v_required_tier := CASE 
        WHEN p_module_key = 'metas_fire' THEN 1
        WHEN p_module_key = 'education' THEN 2
        WHEN p_module_key = 'news' THEN 3
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
