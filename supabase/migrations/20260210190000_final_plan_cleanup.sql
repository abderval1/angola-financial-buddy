-- Final Cleanup and Realignment of Plans (Refined to avoid FK errors)
-- This ensures no legacy 'Gratuito' plans exist and everyone uses the new 4-tier structure.

-- 1. Ensure the new 'Básico' plan exists (or is updated correctly)
-- We use module_key='basic' as our anchor.
DO $$ 
DECLARE 
    v_basic_id UUID;
BEGIN
    -- Update or get the basic plan ID
    UPDATE public.subscription_plans 
    SET 
        name = 'Básico',
        price = 2000,
        tier_level = 1,
        trial_period_days = 7,
        is_active = true
    WHERE module_key = 'basic'
    RETURNING id INTO v_basic_id;

    -- If it didn't exist, insert it and get the ID
    IF v_basic_id IS NULL THEN
        INSERT INTO public.subscription_plans (name, price, module_key, tier_level, trial_period_days, is_active, features, ebook_limit)
        VALUES ('Básico', 2000, 'basic', 1, 7, true, '["Orçamento & Despesas", "Poupança & Dívidas", "Investimentos Básicos"]', 2)
        RETURNING id INTO v_basic_id;
    END IF;

    -- 2. Redirect ALL user_subscriptions pointing to legacy plans to this new Básico plan
    -- We target plans by name or missing module_key
    UPDATE public.user_subscriptions
    SET plan_id = v_basic_id
    WHERE plan_id IN (
        SELECT id FROM public.subscription_plans 
        WHERE (name IN ('Gratuito', 'Iniciante', 'Free') OR module_key IS NULL)
        AND id != v_basic_id
    );

    -- 3. Now it is safe to remove all old plans
    DELETE FROM public.subscription_plans 
    WHERE (name IN ('Gratuito', 'Iniciante', 'Free') OR module_key IS NULL)
    AND id != v_basic_id;

    -- 4. Fix expiration dates that are "today" or in the past for active trials
    -- This unblocks the user who had an immediate expiration
    UPDATE public.user_subscriptions
    SET expires_at = NOW() + INTERVAL '7 days',
        status = 'active'
    WHERE is_trial = true 
    AND (status = 'active' OR status = 'expired')
    AND (expires_at IS NULL OR expires_at <= NOW());

END $$;
