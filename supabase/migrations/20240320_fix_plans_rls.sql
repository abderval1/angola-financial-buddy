
-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow public read access to plans
CREATE POLICY "Public can view subscription plans"
ON subscription_plans FOR SELECT
TO public
USING (true);

-- Allow authenticated users to view plans (redundant but safe)
CREATE POLICY "Authenticated users can view subscription plans"
ON subscription_plans FOR SELECT
TO authenticated
USING (true);

-- Insert Plans if they don't exist (Idempotent)
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
