-- Ensure 'Básico' plan exists and has tier_level 0
DO $$
BEGIN
    -- Update existing plan if it exists
    UPDATE public.subscription_plans 
    SET tier_level = 0, 
        module_key = 'basic',
        price = 2000,
        trial_period_days = 7
    WHERE name = 'Básico' OR name = 'Gratuito';

    -- Insert if it doesn't exist (optional, but good for safety)
    IF NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Básico') THEN
        INSERT INTO public.subscription_plans (name, description, price, features, tier_level, module_key, trial_period_days, ebook_limit)
        VALUES (
            'Básico', 
            'Plano inicial com 7 dias de teste grátis', 
            2000, 
            ARRAY['Acesso ao Dashboard', 'Gestão de Orçamento', 'Gestão de Dívidas', 'Metas de Poupança'], 
            0, 
            'basic', 
            7, 
            0
        );
    END IF;
END $$;
