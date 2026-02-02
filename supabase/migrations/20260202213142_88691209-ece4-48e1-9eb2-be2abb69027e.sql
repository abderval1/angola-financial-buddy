
-- Corrigir políticas para maior segurança
-- Remover políticas permissivas e substituir por políticas mais restritivas

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can create referral on signup" ON public.user_referrals;
DROP POLICY IF EXISTS "System can insert earnings" ON public.user_earnings;

-- Criar políticas mais restritivas usando SECURITY DEFINER functions
-- user_referrals - apenas via função process_referral_signup
CREATE POLICY "Referrals created via system function" ON public.user_referrals
  FOR INSERT WITH CHECK (false); -- Só via SECURITY DEFINER function

-- user_earnings - apenas via funções do sistema
CREATE POLICY "Earnings created via system functions" ON public.user_earnings
  FOR INSERT WITH CHECK (false); -- Só via SECURITY DEFINER functions

-- Criar função para criar código de referral para utilizadores existentes
CREATE OR REPLACE FUNCTION public.ensure_user_referral_code(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- Verificar se já tem código
  SELECT code INTO v_code FROM public.referral_codes WHERE user_id = p_user_id;
  
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;
  
  -- Gerar novo código
  LOOP
    v_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = v_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (p_user_id, v_code);
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para registar ganho de marketplace
CREATE OR REPLACE FUNCTION public.register_marketplace_earning(
  p_seller_id UUID,
  p_amount NUMERIC,
  p_product_id UUID,
  p_description TEXT DEFAULT 'Venda no Marketplace'
) RETURNS UUID AS $$
DECLARE
  v_earning_id UUID;
  v_commission_rate NUMERIC;
  v_net_amount NUMERIC;
BEGIN
  -- Obter taxa de comissão da plataforma
  SELECT (setting_value->>'percentage')::NUMERIC / 100 INTO v_commission_rate
  FROM public.monetization_settings
  WHERE setting_key = 'marketplace_commission';
  
  IF v_commission_rate IS NULL THEN
    v_commission_rate := 0.20; -- 20% padrão
  END IF;
  
  -- Calcular valor líquido após comissão
  v_net_amount := p_amount * (1 - v_commission_rate);
  
  -- Inserir ganho
  INSERT INTO public.user_earnings (user_id, amount, earning_type, source_id, description, status)
  VALUES (p_seller_id, v_net_amount, 'marketplace_sale', p_product_id, p_description, 'approved')
  RETURNING id INTO v_earning_id;
  
  RETURN v_earning_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
