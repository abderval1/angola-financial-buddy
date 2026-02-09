
-- DANGER: Dropping table to ensure clean schema
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- Recreate table with all required columns
CREATE TABLE subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  module_key TEXT UNIQUE NOT NULL,
  tier_level INTEGER DEFAULT 0,
  features TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow public read access (Crucial!)
CREATE POLICY "Public can view subscription plans"
ON subscription_plans FOR SELECT
TO public
USING (true);

-- Allow authenticated insert (for seeding/admin)
CREATE POLICY "Admins can insert subscription plans"
ON subscription_plans FOR INSERT
TO authenticated
WITH CHECK (true);

-- Seed Data immediately
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
);

-- Ensure user_subscriptions can reference it (if constraints were dropped)
-- (The CASCADE drop might have removed FKs in user_subscriptions, let's fix that)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_subscriptions_plan_id_fkey'
    ) THEN
        ALTER TABLE user_subscriptions 
        ADD CONSTRAINT user_subscriptions_plan_id_fkey 
        FOREIGN KEY (plan_id) 
        REFERENCES subscription_plans(id);
    END IF;
END $$;
