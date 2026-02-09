
-- Check if the table exists, if not create it with module_key
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  module_key TEXT UNIQUE NOT NULL, -- Ensure this column exists
  tier_level INTEGER DEFAULT 0,
  features TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- If table exists but module_key is missing, add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'subscription_plans'
        AND column_name = 'module_key'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN module_key TEXT UNIQUE;
    END IF;
END $$;

-- Force schema cache reload (usually done by restarting user session or just waiting, but making sure structure is right is step 1)

-- Re-run the seed to populate data (Upsert will work now if column exists)
INSERT INTO subscription_plans (name, price, module_key, tier_level, features, is_active)
VALUES 
(
  'Gratuito', 
  0, 
  'basic', 
  0, 
  ARRAY['Dashboard Financeiro', 'Gestão de Orçamento & Despesas', 'Rastreio de Dívidas', 'Poupança & Investimentos Básicos', 'Comparador de Preços (Kixikila)', 'Comunidade & Marketplace'],
  true
),
(
  'Essencial', 
  4000, 
  'metas_fire', 
  1, 
  ARRAY['Tudo do Plano Gratuito', 'Módulo Metas & FIRE', 'Simulador de Independência Financeira', 'Gestão de Metas Avançada', 'Coach Virtual Personalizado'],
  true
),
(
  'Pro', 
  8000, 
  'education', 
  2, 
  ARRAY['Tudo do Plano Essencial', 'Módulo de Educação Financeira', 'Cursos Exclusivos & Certificados', 'Calculadoras Avançadas', 'Biblioteca de Recursos'],
  true
),
(
  'Avançado', 
  12000, 
  'news', 
  3, 
  ARRAY['Tudo do Plano Pro', 'Módulo Notícias & Mercado', 'Indicadores Económicos em Tempo Real', 'Relatórios Semanais de Mercado', 'Análises de Tendências Financeiras'],
  true
)
ON CONFLICT (module_key) DO UPDATE 
SET 
  price = EXCLUDED.price,
  tier_level = EXCLUDED.tier_level,
  features = EXCLUDED.features;
