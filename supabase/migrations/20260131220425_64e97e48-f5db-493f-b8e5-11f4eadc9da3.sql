-- =======================================
-- MARKETPLACE PRODUCTS TABLE
-- =======================================
CREATE TABLE public.marketplace_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  product_type VARCHAR NOT NULL CHECK (product_type IN ('ebook', 'course', 'template', 'tool', 'other')),
  price NUMERIC NOT NULL DEFAULT 0,
  currency VARCHAR DEFAULT 'AOA',
  file_url TEXT,
  cover_image_url TEXT,
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published products" ON public.marketplace_products
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage products" ON public.marketplace_products
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- =======================================
-- MARKETPLACE PURCHASES TABLE
-- =======================================
CREATE TABLE public.marketplace_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  purchase_price NUMERIC NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.marketplace_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON public.marketplace_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" ON public.marketplace_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =======================================
-- COMMUNITY CHAT MESSAGES TABLE
-- =======================================
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  room_id VARCHAR DEFAULT 'general',
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view chat messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_deleted = false);

CREATE POLICY "Users can insert own messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" ON public.chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- =======================================
-- COURSE MODULES TABLE (for structured courses)
-- =======================================
CREATE TABLE public.course_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.educational_content(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  video_url TEXT,
  content TEXT,
  duration_minutes INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published course modules" ON public.course_modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.educational_content ec 
      WHERE ec.id = course_id AND ec.is_published = true
    )
  );

CREATE POLICY "Admins can manage course modules" ON public.course_modules
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- =======================================
-- USER MODULE PROGRESS TABLE
-- =======================================
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

ALTER TABLE public.user_module_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own module progress" ON public.user_module_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own module progress" ON public.user_module_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own module progress" ON public.user_module_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- =======================================
-- INVESTOR PROFILE TABLE (for recommendations)
-- =======================================
ALTER TABLE public.financial_profiles ADD COLUMN IF NOT EXISTS investment_experience VARCHAR DEFAULT 'beginner';
ALTER TABLE public.financial_profiles ADD COLUMN IF NOT EXISTS investment_horizon VARCHAR DEFAULT 'medium';
ALTER TABLE public.financial_profiles ADD COLUMN IF NOT EXISTS age_range VARCHAR;

-- =======================================
-- COMMUNITY DISCUSSION THREADS
-- =======================================
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS is_discussion BOOLEAN DEFAULT false;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- =======================================
-- MARKET DATA CACHE UPDATE
-- =======================================
CREATE INDEX IF NOT EXISTS idx_market_data_type_source ON public.market_data_cache(data_type, source);
CREATE INDEX IF NOT EXISTS idx_market_data_expires ON public.market_data_cache(expires_at);

-- Allow service role to insert market data
DROP POLICY IF EXISTS "System can insert market data" ON public.market_data_cache;
CREATE POLICY "System can insert market data" ON public.market_data_cache
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update market data" ON public.market_data_cache
  FOR UPDATE USING (true);

-- =======================================
-- STORAGE BUCKET FOR MARKETPLACE
-- =======================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('marketplace', 'marketplace', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view marketplace files" ON storage.objects
  FOR SELECT USING (bucket_id = 'marketplace');

CREATE POLICY "Admins can upload marketplace files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'marketplace' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete marketplace files" ON storage.objects
  FOR DELETE USING (bucket_id = 'marketplace' AND has_role(auth.uid(), 'admin'::app_role));