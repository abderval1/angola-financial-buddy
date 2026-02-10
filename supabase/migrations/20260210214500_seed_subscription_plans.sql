-- Migration to seed subscription plans
-- Uses PL/PGSQL to handle upserts without relying on a unique constraint

DO $$
BEGIN
    -- 1. Deactivate all plans initially to ensure only the ones we process become active/visible
    UPDATE subscription_plans SET is_active = false;

    -- 2. Upsert 'Básico' (Tier 1)
    IF EXISTS (SELECT 1 FROM subscription_plans WHERE module_key = 'basic') THEN
        UPDATE subscription_plans SET 
            name = 'Básico', 
            price = 2000, 
            tier_level = 1, 
            is_active = true, 
            features = '["Acesso ao Dashboard", "Gestão de Metas", "Simulador FIRE", "Suporte Comunitário", "Acesso a Educação Básica"]'
        WHERE module_key = 'basic';
    ELSE
        INSERT INTO subscription_plans (name, price, module_key, tier_level, is_active, features)
        VALUES ('Básico', 2000, 'basic', 1, true, '["Acesso ao Dashboard", "Gestão de Metas", "Simulador FIRE", "Suporte Comunitário", "Acesso a Educação Básica"]');
    END IF;

    -- 3. Upsert 'Profissional' (Tier 2)
    IF EXISTS (SELECT 1 FROM subscription_plans WHERE module_key = 'education') THEN
        UPDATE subscription_plans SET 
            name = 'Profissional', 
            price = 5000, 
            tier_level = 2, 
            is_active = true, 
            features = '["Tudo do Básico", "Cursos Completos", "Certificados Oficiais", "Calculadoras Avançadas", "Mentoria em Grupo"]'
        WHERE module_key = 'education';
    ELSE
        INSERT INTO subscription_plans (name, price, module_key, tier_level, is_active, features)
        VALUES ('Profissional', 5000, 'education', 2, true, '["Tudo do Básico", "Cursos Completos", "Certificados Oficiais", "Calculadoras Avançadas", "Mentoria em Grupo"]');
    END IF;

    -- 4. Upsert 'Investidor' (Tier 3)
    IF EXISTS (SELECT 1 FROM subscription_plans WHERE module_key = 'news') THEN
        UPDATE subscription_plans SET 
            name = 'Investidor', 
            price = 10000, 
            tier_level = 3, 
            is_active = true, 
            features = '["Tudo do Profissional", "Notícias Premium", "Análises de Mercado", "Relatórios Semanais", "Acesso Antecipado"]'
        WHERE module_key = 'news';
    ELSE
        INSERT INTO subscription_plans (name, price, module_key, tier_level, is_active, features)
        VALUES ('Investidor', 10000, 'news', 3, true, '["Tudo do Profissional", "Notícias Premium", "Análises de Mercado", "Relatórios Semanais", "Acesso Antecipado"]');
    END IF;

    -- 5. Attempt to add unique constraint if possible (optional, but good for future)
    -- We wrap this in a sub-block to avoid failing the main transaction if duplicates exist
    BEGIN
        ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_module_key_key UNIQUE (module_key);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add unique constraint on module_key, likely due to duplicates. Continuing...';
    END;
END $$;
