-- Revert subscription_plans to original structure that was working
DROP TABLE IF EXISTS subscription_plans CASCADE;

CREATE TABLE subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  ebook_limit INTEGER DEFAULT 5,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  currency TEXT DEFAULT 'AOA',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read plans
CREATE POLICY "Anyone can view subscription plans"
ON subscription_plans FOR SELECT
USING (true);

-- Seed with original data
INSERT INTO subscription_plans (name, price, ebook_limit, features, is_active)
VALUES 
(
  'Gratuito', 
  0,
  5,
  '["Dashboard Financeiro", "Gestão de Orçamento & Despesas", "Rastreio de Dívidas", "Poupança & Investimentos Básicos", "Comparador de Preços (Kixikila)", "Comunidade & Marketplace"]'::jsonb,
  true
),
(
  'Essencial', 
  4000,
  10,
  '["Tudo do Plano Gratuito", "Módulo Metas & FIRE", "Simulador de Independência Financeira", "Gestão de Metas Avançada", "Coach Virtual Personalizado"]'::jsonb,
  true
),
(
  'Pro', 
  8000,
  20,
  '["Tudo do Plano Essencial", "Módulo de Educação Financeira", "Cursos Exclusivos & Certificados", "Calculadoras Avançadas", "Biblioteca de Recursos"]'::jsonb,
  true
),
(
  'Avançado', 
  12000,
  50,
  '["Tudo do Plano Pro", "Módulo Notícias & Mercado", "Indicadores Económicos em Tempo Real", "Relatórios Semanais de Mercado", "Análises de Tendências Financeiras"]'::jsonb,
  true
);

-- Restore foreign key if user_subscriptions exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions') THEN
        ALTER TABLE user_subscriptions 
        DROP CONSTRAINT IF EXISTS user_subscriptions_plan_id_fkey;
        
        ALTER TABLE user_subscriptions 
        ADD CONSTRAINT user_subscriptions_plan_id_fkey 
        FOREIGN KEY (plan_id) 
        REFERENCES subscription_plans(id);
    END IF;
END $$;
