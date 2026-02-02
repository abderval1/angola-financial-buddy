
-- Sistema de Referral/Afiliados
CREATE TABLE public.user_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  reward_earned NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  activated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referred_id)
);

-- Códigos de referral únicos por utilizador
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  total_referrals INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  total_earnings NUMERIC(12,2) DEFAULT 0,
  commission_rate NUMERIC(5,2) DEFAULT 10.00, -- 10% padrão
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Histórico de ganhos/rewards
CREATE TABLE public.user_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'AOA',
  earning_type TEXT NOT NULL CHECK (earning_type IN ('referral_signup', 'referral_subscription', 'referral_purchase', 'marketplace_sale', 'challenge_reward', 'content_bonus')),
  source_id UUID, -- ID da referência/venda/etc
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Pedidos de levantamento/payout
CREATE TABLE public.payout_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'AOA',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'mobile_money', 'express')),
  payment_details JSONB NOT NULL, -- {bank_name, account_number, iban, phone, etc}
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  admin_notes TEXT,
  processed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Configurações de monetização do sistema
CREATE TABLE public.monetization_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Inserir configurações padrão
INSERT INTO public.monetization_settings (setting_key, setting_value, description) VALUES
('referral_signup_bonus', '{"referrer": 500, "referred": 250, "currency": "AOA"}', 'Bónus por cada novo registo via referral'),
('referral_subscription_commission', '{"percentage": 10, "max_amount": 5000, "currency": "AOA"}', 'Comissão por subscrição de referido'),
('referral_purchase_commission', '{"percentage": 15, "currency": "AOA"}', 'Comissão por compra no marketplace'),
('minimum_payout', '{"amount": 5000, "currency": "AOA"}', 'Valor mínimo para solicitar levantamento'),
('marketplace_commission', '{"percentage": 20, "currency": "AOA"}', 'Comissão da plataforma sobre vendas');

-- Enable RLS
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monetization_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para referral_codes
CREATE POLICY "Users can view their own referral code" ON public.referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert referral codes" ON public.referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their referral code" ON public.referral_codes
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para user_referrals
CREATE POLICY "Users can view referrals they made" ON public.user_referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Anyone can create referral on signup" ON public.user_referrals
  FOR INSERT WITH CHECK (true);

-- Políticas para user_earnings
CREATE POLICY "Users can view their own earnings" ON public.user_earnings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert earnings" ON public.user_earnings
  FOR INSERT WITH CHECK (true);

-- Políticas para payout_requests
CREATE POLICY "Users can view their own payout requests" ON public.payout_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payout requests" ON public.payout_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para monetization_settings (leitura pública)
CREATE POLICY "Anyone can read monetization settings" ON public.monetization_settings
  FOR SELECT USING (true);

-- Admin policies
CREATE POLICY "Admins can manage all referrals" ON public.user_referrals
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all earnings" ON public.user_earnings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all payout requests" ON public.payout_requests
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update monetization settings" ON public.monetization_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Função para gerar código de referral único
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Gerar código alfanumérico de 8 caracteres
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  -- Criar código de referral para o novo utilizador
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (NEW.id, new_code);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar código quando utilizador é criado
CREATE TRIGGER on_auth_user_created_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();

-- Função para processar referral bonus
CREATE OR REPLACE FUNCTION public.process_referral_signup(
  p_referred_id UUID,
  p_referral_code TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_referrer_id UUID;
  v_settings JSONB;
BEGIN
  -- Encontrar o referrer
  SELECT user_id INTO v_referrer_id
  FROM public.referral_codes
  WHERE code = upper(p_referral_code) AND is_active = true;
  
  IF v_referrer_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Não permitir auto-referral
  IF v_referrer_id = p_referred_id THEN
    RETURN false;
  END IF;
  
  -- Obter configurações de bónus
  SELECT setting_value INTO v_settings
  FROM public.monetization_settings
  WHERE setting_key = 'referral_signup_bonus';
  
  -- Criar registo de referral
  INSERT INTO public.user_referrals (referrer_id, referred_id, referral_code, status, activated_at)
  VALUES (v_referrer_id, p_referred_id, upper(p_referral_code), 'active', now());
  
  -- Criar earning para o referrer
  INSERT INTO public.user_earnings (user_id, amount, earning_type, source_id, description, status)
  VALUES (
    v_referrer_id,
    (v_settings->>'referrer')::NUMERIC,
    'referral_signup',
    p_referred_id,
    'Bónus por indicação de novo utilizador',
    'approved'
  );
  
  -- Criar earning para o referred (bónus de boas-vindas)
  INSERT INTO public.user_earnings (user_id, amount, earning_type, source_id, description, status)
  VALUES (
    p_referred_id,
    (v_settings->>'referred')::NUMERIC,
    'referral_signup',
    v_referrer_id,
    'Bónus de boas-vindas por indicação',
    'approved'
  );
  
  -- Atualizar estatísticas do código
  UPDATE public.referral_codes
  SET 
    total_referrals = total_referrals + 1,
    successful_referrals = successful_referrals + 1,
    total_earnings = total_earnings + (v_settings->>'referrer')::NUMERIC,
    updated_at = now()
  WHERE user_id = v_referrer_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para calcular saldo disponível
CREATE OR REPLACE FUNCTION public.get_user_balance(p_user_id UUID)
RETURNS TABLE (
  total_earned NUMERIC,
  total_pending NUMERIC,
  total_paid NUMERIC,
  available_balance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN status IN ('approved', 'paid') THEN amount ELSE 0 END), 0) as total_earned,
    COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending,
    COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_paid,
    COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) as available_balance
  FROM public.user_earnings
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
