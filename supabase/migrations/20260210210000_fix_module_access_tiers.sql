-- Fix module access tiers to match frontend requirements
-- Education should be Tier 1 (Basic/Essencial)
-- Premium Content should be Tier 3
-- News should be Tier 3 (Avançado)

CREATE OR REPLACE FUNCTION has_module_access(p_user_id UUID, p_module_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_required_tier INTEGER;
    v_user_max_tier INTEGER;
BEGIN
    -- Define required tiers for modules
    v_required_tier := CASE 
        WHEN p_module_key = 'metas_fire' THEN 1
        WHEN p_module_key = 'education' THEN 1 -- Changed from 2 to 1 to allow Basic plan access
        WHEN p_module_key = 'premium_content' THEN 3 -- Added explicit check
        WHEN p_module_key = 'news' THEN 3 -- Match Avançado plan (Tier 3)
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
