-- Simple insert of subscription plans
-- Delete existing plans first to avoid duplicates
DELETE FROM subscription_plans;

-- Insert the 4 plans
INSERT INTO subscription_plans (name, price, ebook_limit, features, is_active, currency)
VALUES 
(
  'Gratuito', 
  0,
  5,
  '["Dashboard Financeiro", "Gestão de Orçamento & Despesas", "Rastreio de Dívidas", "Poupança & Investimentos Básicos", "Comparador de Preços (Kixikila)", "Comunidade & Marketplace"]'::jsonb,
  true,
  'AOA'
),
(
  'Essencial', 
  4000,
  10,
  '["Tudo do Plano Gratuito", "Módulo Metas & FIRE", "Simulador de Independência Financeira", "Gestão de Metas Avançada", "Coach Virtual Personalizado"]'::jsonb,
  true,
  'AOA'
),
(
  'Pro', 
  8000,
  20,
  '["Tudo do Plano Essencial", "Módulo de Educação Financeira", "Cursos Exclusivos & Certificados", "Calculadoras Avançadas", "Biblioteca de Recursos"]'::jsonb,
  true,
  'AOA'
),
(
  'Avançado', 
  12000,
  50,
  '["Tudo do Plano Pro", "Módulo Notícias & Mercado", "Indicadores Económicos em Tempo Real", "Relatórios Semanais de Mercado", "Análises de Tendências Financeiras"]'::jsonb,
  true,
  'AOA'
);
