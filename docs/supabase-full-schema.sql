-- =====================================================
-- KWANZASMART - FULL DATABASE SCHEMA
-- Execute this script in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. ENUMS
-- =====================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.business_type AS ENUM ('side_hustle', 'freelance', 'small_business', 'investment', 'passive_income');
CREATE TYPE public.challenge_status AS ENUM ('upcoming', 'active', 'completed', 'expired');
CREATE TYPE public.content_type AS ENUM ('article', 'video', 'course', 'quiz', 'calculator');
CREATE TYPE public.goal_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.goal_status AS ENUM ('active', 'completed', 'paused', 'cancelled');

-- =====================================================
-- 2. TABLES
-- =====================================================

-- Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  avatar_url TEXT,
  language VARCHAR DEFAULT 'pt',
  currency VARCHAR DEFAULT 'AOA',
  notification_preferences JSONB DEFAULT '{"sms": false, "push": true, "email": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role public.app_role DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Financial Profiles
CREATE TABLE public.financial_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  age_range VARCHAR,
  monthly_income NUMERIC,
  investment_experience VARCHAR,
  investment_horizon VARCHAR,
  risk_profile VARCHAR,
  financial_goals TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Gamification
CREATE TABLE public.user_gamification (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  level_name VARCHAR DEFAULT 'Iniciante',
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  goals_achieved INTEGER DEFAULT 0,
  rank_position INTEGER,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Transaction Categories
CREATE TABLE public.transaction_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  icon VARCHAR,
  color VARCHAR,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Transactions
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.transaction_categories(id),
  amount NUMERIC NOT NULL,
  type VARCHAR NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Budget Alerts
CREATE TABLE public.budget_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.transaction_categories(id),
  limit_amount NUMERIC NOT NULL,
  period VARCHAR DEFAULT 'monthly',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Financial Goals
CREATE TABLE public.financial_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  goal_type VARCHAR NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  monthly_contribution NUMERIC DEFAULT 0,
  priority public.goal_priority DEFAULT 'medium',
  status public.goal_status DEFAULT 'active',
  target_date DATE,
  is_fire_goal BOOLEAN DEFAULT false,
  fire_type VARCHAR,
  annual_expenses NUMERIC,
  safe_withdrawal_rate NUMERIC DEFAULT 4,
  icon VARCHAR,
  color VARCHAR,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Savings Goals
CREATE TABLE public.savings_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR NOT NULL,
  target_amount NUMERIC NOT NULL,
  saved_amount NUMERIC DEFAULT 0,
  monthly_contribution NUMERIC DEFAULT 0,
  interest_rate NUMERIC DEFAULT 0,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  status VARCHAR DEFAULT 'active',
  icon VARCHAR,
  color VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Debts
CREATE TABLE public.debts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  creditor VARCHAR NOT NULL,
  original_amount NUMERIC NOT NULL,
  current_amount NUMERIC NOT NULL,
  interest_rate NUMERIC DEFAULT 0,
  monthly_payment NUMERIC,
  due_date DATE,
  status VARCHAR DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Investments
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  amount NUMERIC NOT NULL,
  current_value NUMERIC,
  expected_return NUMERIC,
  actual_return NUMERIC,
  risk_level VARCHAR DEFAULT 'medium',
  status VARCHAR DEFAULT 'active',
  start_date DATE DEFAULT CURRENT_DATE,
  maturity_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Income Sources
CREATE TABLE public.income_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  business_type public.business_type NOT NULL,
  category VARCHAR,
  monthly_revenue NUMERIC DEFAULT 0,
  monthly_expenses NUMERIC DEFAULT 0,
  initial_investment NUMERIC DEFAULT 0,
  start_date DATE,
  status VARCHAR DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Financial Reports
CREATE TABLE public.financial_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_type VARCHAR NOT NULL,
  report_name VARCHAR NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  data JSONB NOT NULL,
  file_url TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Achievements
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  icon VARCHAR,
  category VARCHAR,
  points INTEGER DEFAULT 0,
  requirement JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Achievements
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id),
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Challenges
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  challenge_type VARCHAR NOT NULL,
  target_metric VARCHAR,
  target_value NUMERIC,
  duration_days INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  points_reward INTEGER DEFAULT 50,
  badge_reward VARCHAR,
  icon VARCHAR,
  difficulty VARCHAR DEFAULT 'medium',
  max_participants INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Challenges
CREATE TABLE public.user_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id),
  status public.challenge_status DEFAULT 'active',
  current_progress NUMERIC DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  points_earned INTEGER DEFAULT 0,
  notes TEXT,
  UNIQUE(user_id, challenge_id)
);

-- Educational Content
CREATE TABLE public.educational_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR NOT NULL,
  slug VARCHAR NOT NULL UNIQUE,
  description TEXT,
  content TEXT,
  content_type public.content_type NOT NULL,
  category VARCHAR NOT NULL,
  difficulty_level VARCHAR DEFAULT 'beginner',
  thumbnail_url TEXT,
  video_url TEXT,
  duration_minutes INTEGER,
  points_reward INTEGER DEFAULT 10,
  tags TEXT[],
  is_premium BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Course Modules
CREATE TABLE public.course_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.educational_content(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  content TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  media_type TEXT DEFAULT 'text',
  order_index INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  has_quiz BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Course Quizzes
CREATE TABLE public.course_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.educational_content(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  is_final_quiz BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Quiz Questions
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.course_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice',
  options JSONB DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 10,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Content Progress
CREATE TABLE public.user_content_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID NOT NULL REFERENCES public.educational_content(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  quiz_score INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, content_id)
);

-- User Module Progress
CREATE TABLE public.user_module_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- User Quiz Attempts
CREATE TABLE public.user_quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_id UUID NOT NULL REFERENCES public.course_quizzes(id) ON DELETE CASCADE,
  score INTEGER,
  total_points INTEGER,
  passed BOOLEAN,
  answers JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Certificates
CREATE TABLE public.user_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.educational_content(id),
  certificate_number TEXT NOT NULL UNIQUE,
  user_name TEXT,
  course_title TEXT,
  completion_date TIMESTAMP WITH TIME ZONE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Community Posts
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  is_discussion BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Post Comments
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  reply_to_id UUID REFERENCES public.post_comments(id) ON DELETE SET NULL,
  likes_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Post Reactions
CREATE TABLE public.post_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, emoji)
);

-- Chat Messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  room_id UUID,
  content TEXT NOT NULL,
  reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Chat Reactions
CREATE TABLE public.chat_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- News
CREATE TABLE public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  source TEXT NOT NULL,
  url TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'geral',
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  fetched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User News Favorites
CREATE TABLE public.user_news_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, news_id)
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT,
  priority TEXT,
  action_url TEXT,
  metadata JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Price Products
CREATE TABLE public.price_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  unit VARCHAR DEFAULT 'unidade',
  is_essential BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Stores
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  location TEXT,
  city TEXT,
  store_type VARCHAR,
  is_verified BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Price Entries
CREATE TABLE public.price_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.price_products(id),
  product_name VARCHAR NOT NULL,
  store_id UUID REFERENCES public.stores(id),
  store_name VARCHAR NOT NULL,
  price NUMERIC NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit VARCHAR DEFAULT 'unidade',
  currency VARCHAR DEFAULT 'AOA',
  is_essential BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  purchase_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Product Follows
CREATE TABLE public.user_product_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.price_products(id),
  product_name TEXT,
  lowest_price_seen NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Subscription Plans
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  price NUMERIC NOT NULL,
  currency VARCHAR DEFAULT 'AOA',
  ebook_limit INTEGER NOT NULL DEFAULT 2,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Subscriptions
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id),
  status VARCHAR DEFAULT 'pending',
  payment_proof_url TEXT,
  payment_method VARCHAR DEFAULT 'manual',
  started_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Marketplace Products
CREATE TABLE public.marketplace_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  product_type TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  currency VARCHAR DEFAULT 'AOA',
  cover_image_url TEXT,
  file_url TEXT,
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_subscription_included BOOLEAN DEFAULT false,
  requires_subscription BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Marketplace Purchases
CREATE TABLE public.marketplace_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id),
  purchase_price NUMERIC NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ebook Downloads
CREATE TABLE public.ebook_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.marketplace_products(id),
  subscription_id UUID REFERENCES public.user_subscriptions(id),
  is_free_download BOOLEAN DEFAULT false,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Market Data Cache
CREATE TABLE public.market_data_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source VARCHAR NOT NULL,
  data_type VARCHAR NOT NULL,
  symbol VARCHAR,
  data JSONB NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Referral Codes
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  commission_rate NUMERIC DEFAULT 0.1,
  total_referrals INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Referrals
CREATE TABLE public.user_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL UNIQUE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reward_earned NUMERIC DEFAULT 0,
  activated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Earnings
CREATE TABLE public.user_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  earning_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'AOA',
  source_id UUID,
  description TEXT,
  status TEXT DEFAULT 'pending',
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payout Requests
CREATE TABLE public.payout_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'AOA',
  payment_method TEXT NOT NULL,
  payment_details JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Monetization Settings
CREATE TABLE public.monetization_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- 3. FUNCTIONS
-- =====================================================

-- Has Role Function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update Updated At Column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Handle New User
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'name', NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  INSERT INTO public.financial_profiles (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.user_gamification (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Generate Referral Code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (NEW.id, new_code);
  
  RETURN NEW;
END;
$$;

-- Ensure User Referral Code
CREATE OR REPLACE FUNCTION public.ensure_user_referral_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code TEXT;
  code_exists BOOLEAN;
BEGIN
  SELECT code INTO v_code FROM public.referral_codes WHERE user_id = p_user_id;
  
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;
  
  LOOP
    v_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = v_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (p_user_id, v_code);
  
  RETURN v_code;
END;
$$;

-- Process Referral Signup
CREATE OR REPLACE FUNCTION public.process_referral_signup(p_referred_id uuid, p_referral_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_id UUID;
  v_settings JSONB;
BEGIN
  SELECT user_id INTO v_referrer_id
  FROM public.referral_codes
  WHERE code = upper(p_referral_code) AND is_active = true;
  
  IF v_referrer_id IS NULL THEN
    RETURN false;
  END IF;
  
  IF v_referrer_id = p_referred_id THEN
    RETURN false;
  END IF;
  
  SELECT setting_value INTO v_settings
  FROM public.monetization_settings
  WHERE setting_key = 'referral_signup_bonus';
  
  INSERT INTO public.user_referrals (referrer_id, referred_id, referral_code, status, activated_at)
  VALUES (v_referrer_id, p_referred_id, upper(p_referral_code), 'active', now());
  
  INSERT INTO public.user_earnings (user_id, amount, earning_type, source_id, description, status)
  VALUES (
    v_referrer_id,
    (v_settings->>'referrer')::NUMERIC,
    'referral_signup',
    p_referred_id,
    'Bónus por indicação de novo utilizador',
    'approved'
  );
  
  INSERT INTO public.user_earnings (user_id, amount, earning_type, source_id, description, status)
  VALUES (
    p_referred_id,
    (v_settings->>'referred')::NUMERIC,
    'referral_signup',
    v_referrer_id,
    'Bónus de boas-vindas por indicação',
    'approved'
  );
  
  UPDATE public.referral_codes
  SET 
    total_referrals = total_referrals + 1,
    successful_referrals = successful_referrals + 1,
    total_earnings = total_earnings + (v_settings->>'referrer')::NUMERIC,
    updated_at = now()
  WHERE user_id = v_referrer_id;
  
  RETURN true;
END;
$$;

-- Get User Balance
CREATE OR REPLACE FUNCTION public.get_user_balance(p_user_id uuid)
RETURNS TABLE(total_earned numeric, total_pending numeric, total_paid numeric, available_balance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Promote to Admin
CREATE OR REPLACE FUNCTION public.promote_to_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can promote users';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN true;
END;
$$;

-- Demote from Admin
CREATE OR REPLACE FUNCTION public.demote_from_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can demote users';
  END IF;
  
  DELETE FROM public.user_roles 
  WHERE user_id = target_user_id AND role = 'admin';
  
  RETURN true;
END;
$$;

-- Get User Free Downloads
CREATE OR REPLACE FUNCTION public.get_user_free_downloads(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.ebook_downloads
  WHERE user_id = p_user_id 
  AND is_free_download = true
$$;

-- Can Download Free Ebook
CREATE OR REPLACE FUNCTION public.can_download_free_ebook(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_ebook_limit INTEGER;
  v_current_downloads INTEGER;
BEGIN
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
  
  SELECT COUNT(*) INTO v_current_downloads
  FROM public.ebook_downloads
  WHERE user_id = p_user_id 
  AND is_free_download = true;
  
  RETURN v_current_downloads < v_ebook_limit;
END;
$$;

-- Notify Price Drop
CREATE OR REPLACE FUNCTION public.notify_price_drop()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  follower RECORD;
  product_title TEXT;
  store_title TEXT;
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    SELECT name INTO product_title FROM public.price_products WHERE id = NEW.product_id;
  ELSE
    product_title := NEW.product_name;
  END IF;
  
  IF NEW.store_id IS NOT NULL THEN
    SELECT name INTO store_title FROM public.stores WHERE id = NEW.store_id;
  ELSE
    store_title := NEW.store_name;
  END IF;

  FOR follower IN
    SELECT upf.user_id, upf.lowest_price_seen, upf.id as follow_id
    FROM public.user_product_follows upf
    WHERE (upf.product_id = NEW.product_id OR upf.product_name = NEW.product_name)
      AND upf.user_id != NEW.user_id
      AND (upf.lowest_price_seen IS NULL OR NEW.price < upf.lowest_price_seen)
  LOOP
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      priority,
      action_url,
      metadata
    ) VALUES (
      follower.user_id,
      'Preço mais baixo encontrado!',
      format('%s está agora a %s Kz em %s', product_title, NEW.price::TEXT, store_title),
      'price_alert',
      'high',
      '/prices',
      jsonb_build_object(
        'product_name', product_title,
        'new_price', NEW.price,
        'old_lowest_price', follower.lowest_price_seen,
        'store_name', store_title,
        'savings', COALESCE(follower.lowest_price_seen - NEW.price, 0)
      )
    );
    
    UPDATE public.user_product_follows
    SET lowest_price_seen = NEW.price
    WHERE id = follower.follow_id;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Register Marketplace Earning
CREATE OR REPLACE FUNCTION public.register_marketplace_earning(p_seller_id uuid, p_amount numeric, p_product_id uuid, p_description text DEFAULT 'Venda no Marketplace'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_earning_id UUID;
  v_commission_rate NUMERIC;
  v_net_amount NUMERIC;
BEGIN
  SELECT (setting_value->>'percentage')::NUMERIC / 100 INTO v_commission_rate
  FROM public.monetization_settings
  WHERE setting_key = 'marketplace_commission';
  
  IF v_commission_rate IS NULL THEN
    v_commission_rate := 0.20;
  END IF;
  
  v_net_amount := p_amount * (1 - v_commission_rate);
  
  INSERT INTO public.user_earnings (user_id, amount, earning_type, source_id, description, status)
  VALUES (p_seller_id, v_net_amount, 'marketplace_sale', p_product_id, p_description, 'approved')
  RETURNING id INTO v_earning_id;
  
  RETURN v_earning_id;
END;
$$;

-- =====================================================
-- 4. TRIGGERS
-- =====================================================

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for price drop notifications
CREATE TRIGGER on_price_entry_created
  AFTER INSERT ON public.price_entries
  FOR EACH ROW EXECUTE FUNCTION public.notify_price_drop();

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_content_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_news_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_product_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monetization_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- User Roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Financial Profiles policies
CREATE POLICY "Users can view own financial profile" ON public.financial_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own financial profile" ON public.financial_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own financial profile" ON public.financial_profiles FOR UPDATE USING (auth.uid() = user_id);

-- User Gamification policies
CREATE POLICY "Users can view all gamification stats" ON public.user_gamification FOR SELECT USING (true);
CREATE POLICY "Users can insert own stats" ON public.user_gamification FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stats" ON public.user_gamification FOR UPDATE USING (auth.uid() = user_id);

-- Transaction Categories policies
CREATE POLICY "Users can view own categories" ON public.transaction_categories FOR SELECT USING ((auth.uid() = user_id) OR (is_default = true));
CREATE POLICY "Users can insert own categories" ON public.transaction_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.transaction_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.transaction_categories FOR DELETE USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Budget Alerts policies
CREATE POLICY "Users can view own alerts" ON public.budget_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON public.budget_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.budget_alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON public.budget_alerts FOR DELETE USING (auth.uid() = user_id);

-- Financial Goals policies
CREATE POLICY "Users can view own goals" ON public.financial_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.financial_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.financial_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.financial_goals FOR DELETE USING (auth.uid() = user_id);

-- Savings Goals policies
CREATE POLICY "Users can view own savings goals" ON public.savings_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own savings goals" ON public.savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own savings goals" ON public.savings_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own savings goals" ON public.savings_goals FOR DELETE USING (auth.uid() = user_id);

-- Debts policies
CREATE POLICY "Users can view own debts" ON public.debts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own debts" ON public.debts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own debts" ON public.debts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own debts" ON public.debts FOR DELETE USING (auth.uid() = user_id);

-- Investments policies
CREATE POLICY "Users can view own investments" ON public.investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own investments" ON public.investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own investments" ON public.investments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own investments" ON public.investments FOR DELETE USING (auth.uid() = user_id);

-- Income Sources policies
CREATE POLICY "Users can view own income sources" ON public.income_sources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own income sources" ON public.income_sources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own income sources" ON public.income_sources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own income sources" ON public.income_sources FOR DELETE USING (auth.uid() = user_id);

-- Financial Reports policies
CREATE POLICY "Users can view own reports" ON public.financial_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON public.financial_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON public.financial_reports FOR DELETE USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Admins can manage achievements" ON public.achievements FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User Achievements policies
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Challenges policies
CREATE POLICY "Anyone can view active challenges" ON public.challenges FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage challenges" ON public.challenges FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User Challenges policies
CREATE POLICY "Users can view own challenges" ON public.user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own challenges" ON public.user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenges" ON public.user_challenges FOR UPDATE USING (auth.uid() = user_id);

-- Educational Content policies
CREATE POLICY "Anyone can view published content" ON public.educational_content FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage content" ON public.educational_content FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Course Modules policies
CREATE POLICY "Anyone can view published course modules" ON public.course_modules FOR SELECT USING (EXISTS (SELECT 1 FROM educational_content ec WHERE ec.id = course_modules.course_id AND ec.is_published = true));
CREATE POLICY "Admins can manage course modules" ON public.course_modules FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Course Quizzes policies
CREATE POLICY "Quizzes are viewable by everyone" ON public.course_quizzes FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage quizzes" ON public.course_quizzes FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Quiz Questions policies
CREATE POLICY "Questions are viewable by everyone" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Admins can manage questions" ON public.quiz_questions FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- User Content Progress policies
CREATE POLICY "Users can view own progress" ON public.user_content_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.user_content_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.user_content_progress FOR UPDATE USING (auth.uid() = user_id);

-- User Module Progress policies
CREATE POLICY "Users can view own module progress" ON public.user_module_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own module progress" ON public.user_module_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own module progress" ON public.user_module_progress FOR UPDATE USING (auth.uid() = user_id);

-- User Quiz Attempts policies
CREATE POLICY "Users can view own quiz attempts" ON public.user_quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quiz attempts" ON public.user_quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quiz attempts" ON public.user_quiz_attempts FOR UPDATE USING (auth.uid() = user_id);

-- User Certificates policies
CREATE POLICY "Users can view own certificates" ON public.user_certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own certificates" ON public.user_certificates FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Community Posts policies
CREATE POLICY "Anyone can view approved posts" ON public.community_posts FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can insert own posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.community_posts FOR DELETE USING (auth.uid() = user_id);

-- Post Comments policies
CREATE POLICY "Anyone can view approved comments" ON public.post_comments FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can insert own comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

-- Post Reactions policies
CREATE POLICY "Anyone can view post reactions" ON public.post_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add post reactions" ON public.post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own post reactions" ON public.post_reactions FOR DELETE USING (auth.uid() = user_id);

-- Chat Messages policies
CREATE POLICY "Anyone can view chat messages" ON public.chat_messages FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can insert chat messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat messages" ON public.chat_messages FOR UPDATE USING (auth.uid() = user_id);

-- Chat Reactions policies
CREATE POLICY "Anyone can view reactions" ON public.chat_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reactions" ON public.chat_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own reactions" ON public.chat_reactions FOR DELETE USING (auth.uid() = user_id);

-- News policies
CREATE POLICY "Anyone can view approved news" ON public.news FOR SELECT USING (is_approved = true);
CREATE POLICY "Admins can manage news" ON public.news FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User News Favorites policies
CREATE POLICY "Users can view their own favorites" ON public.user_news_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add their own favorites" ON public.user_news_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own favorites" ON public.user_news_favorites FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Price Products policies
CREATE POLICY "Anyone can view products" ON public.price_products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON public.price_products FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Stores policies
CREATE POLICY "Anyone can view stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Users can create stores" ON public.stores FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins can manage stores" ON public.stores FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Price Entries policies
CREATE POLICY "Anyone can view price entries" ON public.price_entries FOR SELECT USING (true);
CREATE POLICY "Users can insert own entries" ON public.price_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries" ON public.price_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entries" ON public.price_entries FOR DELETE USING (auth.uid() = user_id);

-- User Product Follows policies
CREATE POLICY "Users can view own follows" ON public.user_product_follows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own follows" ON public.user_product_follows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own follows" ON public.user_product_follows FOR DELETE USING (auth.uid() = user_id);

-- Subscription Plans policies
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage plans" ON public.subscription_plans FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pending subscriptions" ON public.user_subscriptions FOR UPDATE USING ((auth.uid() = user_id) AND (status = 'pending'));
CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update subscriptions" ON public.user_subscriptions FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Marketplace Products policies
CREATE POLICY "Anyone can view published products" ON public.marketplace_products FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage marketplace products" ON public.marketplace_products FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Marketplace Purchases policies
CREATE POLICY "Users can view own purchases" ON public.marketplace_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON public.marketplace_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ebook Downloads policies
CREATE POLICY "Users can view own downloads" ON public.ebook_downloads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own downloads" ON public.ebook_downloads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all downloads" ON public.ebook_downloads FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Market Data Cache policies
CREATE POLICY "Anyone can view market data" ON public.market_data_cache FOR SELECT USING (true);
CREATE POLICY "System can insert market data" ON public.market_data_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update market data" ON public.market_data_cache FOR UPDATE USING (true);

-- Referral Codes policies
CREATE POLICY "Users can view own referral code" ON public.referral_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage referral codes" ON public.referral_codes FOR ALL USING (true);

-- User Referrals policies
CREATE POLICY "Users can view referrals they made" ON public.user_referrals FOR SELECT USING ((auth.uid() = referrer_id) OR (auth.uid() = referred_id));
CREATE POLICY "Referrals created via system function" ON public.user_referrals FOR INSERT WITH CHECK (false);
CREATE POLICY "Admins can manage all referrals" ON public.user_referrals FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User Earnings policies
CREATE POLICY "Users can view their own earnings" ON public.user_earnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Earnings created via system functions" ON public.user_earnings FOR INSERT WITH CHECK (false);
CREATE POLICY "Admins can manage all earnings" ON public.user_earnings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Payout Requests policies
CREATE POLICY "Users can view their own payout requests" ON public.payout_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create payout requests" ON public.payout_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all payout requests" ON public.payout_requests FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Monetization Settings policies
CREATE POLICY "Anyone can read monetization settings" ON public.monetization_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update monetization settings" ON public.monetization_settings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- 6. STORAGE BUCKETS
-- =====================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('marketplace', 'marketplace', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false);

-- Storage policies for marketplace bucket
CREATE POLICY "Anyone can view marketplace files" ON storage.objects FOR SELECT USING (bucket_id = 'marketplace');
CREATE POLICY "Admins can upload to marketplace" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'marketplace' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update marketplace files" ON storage.objects FOR UPDATE USING (bucket_id = 'marketplace' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete marketplace files" ON storage.objects FOR DELETE USING (bucket_id = 'marketplace' AND has_role(auth.uid(), 'admin'));

-- Storage policies for payment-proofs bucket
CREATE POLICY "Users can view own payment proofs" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload payment proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can view all payment proofs" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs' AND has_role(auth.uid(), 'admin'));

-- =====================================================
-- 7. REALTIME
-- =====================================================

-- Enable realtime for chat and reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;

-- =====================================================
-- 8. INITIAL DATA
-- =====================================================

-- Insert default monetization settings
INSERT INTO public.monetization_settings (setting_key, setting_value, description) VALUES
('referral_signup_bonus', '{"referrer": 500, "referred": 250}', 'Bónus de referral para quem indica e quem é indicado'),
('marketplace_commission', '{"percentage": 20}', 'Comissão da plataforma sobre vendas no marketplace'),
('minimum_payout', '{"amount": 5000}', 'Valor mínimo para solicitar levantamento');

-- =====================================================
-- SCRIPT COMPLETE!
-- =====================================================
