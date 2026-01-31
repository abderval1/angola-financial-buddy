-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  price NUMERIC NOT NULL,
  currency VARCHAR DEFAULT 'AOA',
  ebook_limit INTEGER NOT NULL DEFAULT 2,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id),
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  payment_proof_url TEXT,
  payment_method VARCHAR DEFAULT 'manual',
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create ebook downloads tracking table
CREATE TABLE public.ebook_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.marketplace_products(id),
  subscription_id UUID REFERENCES public.user_subscriptions(id),
  is_free_download BOOLEAN DEFAULT false,
  downloaded_at TIMESTAMPTZ DEFAULT now()
);

-- Add ebook-specific columns to marketplace_products
ALTER TABLE public.marketplace_products 
ADD COLUMN IF NOT EXISTS is_subscription_included BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_subscription BOOLEAN DEFAULT false;

-- Create payment proofs storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_downloads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.subscription_plans
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.user_subscriptions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending subscriptions" ON public.user_subscriptions
FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update subscriptions" ON public.user_subscriptions
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ebook_downloads
CREATE POLICY "Users can view own downloads" ON public.ebook_downloads
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own downloads" ON public.ebook_downloads
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all downloads" ON public.ebook_downloads
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies for payment-proofs bucket
CREATE POLICY "Users can upload payment proofs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payment-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own payment proofs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all payment proofs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-proofs' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, price, ebook_limit, features) VALUES
('Básico', 4000, 2, '["Acesso a 2 ebooks grátis", "Acesso básico a cursos", "Suporte por email"]'::jsonb),
('Intermediário', 6000, 3, '["Acesso a 3 ebooks grátis", "Acesso completo a cursos", "Suporte prioritário", "Comunidade exclusiva"]'::jsonb),
('Premium', 15000, 4, '["Acesso a 4 ebooks grátis", "Acesso VIP a todos cursos", "Suporte 24/7", "Comunidade exclusiva", "Consultoria mensal"]'::jsonb);

-- Function to count user free downloads
CREATE OR REPLACE FUNCTION public.get_user_free_downloads(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.ebook_downloads
  WHERE user_id = p_user_id 
  AND is_free_download = true
$$;

-- Function to check if user can download free ebook
CREATE OR REPLACE FUNCTION public.can_download_free_ebook(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ebook_limit INTEGER;
  v_current_downloads INTEGER;
BEGIN
  -- Get user's active subscription ebook limit
  SELECT sp.ebook_limit INTO v_ebook_limit
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id 
  AND us.status = 'active'
  AND (us.expires_at IS NULL OR us.expires_at > now())
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  IF v_ebook_limit IS NULL THEN
    RETURN false;
  END IF;
  
  -- Count current free downloads
  SELECT COUNT(*) INTO v_current_downloads
  FROM public.ebook_downloads
  WHERE user_id = p_user_id 
  AND is_free_download = true;
  
  RETURN v_current_downloads < v_ebook_limit;
END;
$$;