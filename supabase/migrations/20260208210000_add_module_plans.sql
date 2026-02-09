-- Add module_key to subscription_plans to distinguish between feature sets
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS module_key TEXT UNIQUE;

-- Update existing plans with a default module_key if needed (optional)
UPDATE public.subscription_plans SET module_key = 'legacy_basico' WHERE name = 'Básico';
UPDATE public.subscription_plans SET module_key = 'legacy_intermediario' WHERE name = 'Intermediário';
UPDATE public.subscription_plans SET module_key = 'legacy_premium' WHERE name = 'Premium';

-- Insert the new module-based plans
INSERT INTO public.subscription_plans (name, price, ebook_limit, features, module_key) VALUES
('Metas & FIRE', 4000, 0, '["Planeamento financeiro completo", "Simulador FIRE", "Gestão de metas pessoais", "Alertas e recomendações personalizadas"]'::jsonb, 'metas_fire'),
('Educação', 4000, 5, '["Cursos e guias de finanças práticas", "Conteúdos educativos contínuos", "Calculadoras avançadas exclusivas"]'::jsonb, 'education'),
('Notícias', 4000, 0, '["Notícias financeiras adaptadas", "Atualizações sobre bancos e investimentos", "Análises de mercado"]'::jsonb, 'news')
ON CONFLICT (module_key) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  features = EXCLUDED.features;

-- Function to check if a user has access to a specific module
CREATE OR REPLACE FUNCTION public.has_module_access(p_user_id UUID, p_module_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins have access to everything
  IF public.has_role(p_user_id, 'admin') THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id 
    AND us.status = 'active'
    AND sp.module_key = p_module_key
    AND (us.expires_at IS NULL OR us.expires_at > now())
  );
END;
$$;
