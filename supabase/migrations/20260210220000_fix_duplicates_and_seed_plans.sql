-- Super Fix for Subscription Plans (V5 - Final User Requests + Trial Days)
-- 1. Handles duplicates by archiving them
-- 2. Adds UNIQUE constraint on module_key (Safely)
-- 3. Adds trial_period_days column if missing
-- 4. Upserts the 4 specific plans requested by the user

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Archive duplicates logic
    FOR r IN (
        SELECT module_key 
        FROM subscription_plans 
        WHERE module_key IS NOT NULL 
        GROUP BY module_key 
        HAVING COUNT(*) > 1
    ) LOOP
        UPDATE subscription_plans
        SET 
            is_active = false, 
            module_key = module_key || '_archived_' || substr(id::text, 1, 8)
        WHERE id IN (
            SELECT id 
            FROM subscription_plans 
            WHERE module_key = r.module_key
            AND id != (
                SELECT id 
                FROM subscription_plans 
                WHERE module_key = r.module_key 
                ORDER BY created_at DESC, updated_at DESC 
                LIMIT 1
            )
        );
    END LOOP;

    -- 2. Add Unique Constraint only if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'subscription_plans_module_key_key'
    ) THEN
        ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_module_key_key UNIQUE (module_key);
    END IF;

    -- 3. Add trial_period_days column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_plans' AND column_name = 'trial_period_days'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN trial_period_days INTEGER DEFAULT 0;
    END IF;

END $$;

-- 4. Upsert the 4 Plans
INSERT INTO subscription_plans (name, price, module_key, tier_level, is_active, features, trial_period_days)
VALUES 
    -- 1. Básico (2.000 Kz) - 7 Days Trial
    (
        'Básico', 
        2000, 
        'basic', 
        1, 
        true, 
        '["Orçamento & Despesas", "Poupança & Dívidas", "Investimentos Básicos", "Comparador Kixikila", "Calculadoras & Renda Extra", "Comunidade & Marketplace"]'::jsonb,
        7 -- 7 Days Trial
    ),
    -- 2. Essencial (4.000 Kz)
    (
        'Essencial', 
        4000, 
        'metas_fire', 
        1, 
        true, 
        '["Tudo do Plano Básico", "Módulo Metas & FIRE", "Simulador de Independência", "Gestão Metas Avançada", "Coach Virtual Personalizado"]'::jsonb,
        0
    ),
    -- 3. Pro (8.000 Kz)
    (
        'Pro', 
        8000, 
        'education', 
        2, 
        true, 
        '["Tudo do Plano Essencial", "Módulo de Educação", "Cursos & Certificados", "Calculadoras Premium", "Recursos Exclusivos"]'::jsonb,
        0
    ),
    -- 4. Avançado (12.000 Kz)
    (
        'Avançado', 
        12000, 
        'news', 
        3, 
        true, 
        '["Tudo do Plano Pro", "Módulo Notícias & Mercado", "Indicadores Económicos", "Relatórios Semanais", "Análise de Tendências"]'::jsonb,
        0
    )
ON CONFLICT (module_key) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    tier_level = EXCLUDED.tier_level,
    is_active = true,
    features = EXCLUDED.features,
    trial_period_days = EXCLUDED.trial_period_days;
