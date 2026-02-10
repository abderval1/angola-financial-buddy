-- Fix module access tiers to match Plan Descriptions
-- Básico (Tier 1): Core features
-- Essencial (Tier 2): Adds Metas & FIRE
-- Pro (Tier 3): Adds Educação
-- Avançado (Tier 4): Adds Notícias, Relatórios, Análises

CREATE OR REPLACE FUNCTION has_module_access(p_user_id UUID, p_module_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_required_tier INTEGER;
    v_user_max_tier INTEGER;
BEGIN
    -- Define required tiers for modules
    v_required_tier := CASE 
        WHEN p_module_key = 'metas_fire' THEN 2    -- Essencial
        WHEN p_module_key = 'education' THEN 3     -- Pro
        WHEN p_module_key = 'premium_content' THEN 3 -- Pro
        WHEN p_module_key = 'news' THEN 4          -- Avançado
        WHEN p_module_key = 'reports' THEN 4       -- Avançado
        WHEN p_module_key = 'advanced_analytics' THEN 4 -- Avançado
        ELSE 0 -- Basic/Public features (Tier 0 or 1 usually accessible to all active)
    END;

    -- Get user's highest active tier level
    SELECT MAX(sp.tier_level)
    INTO v_user_max_tier
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id 
    AND us.status = 'active'
    AND (us.expires_at IS NULL OR us.expires_at > NOW());

    -- If user has no active plan, v_user_max_tier will be NULL
    -- If required tier is 0, allow access even without plan? 
    -- Usually features requiring logic check imply SOME plan is needed unless it's truly public.
    -- Assuming Tier 1 is minimum for "Active Plan".
    
    RETURN COALESCE(v_user_max_tier, 0) >= v_required_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
