-- 1. Create Receipts Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS for Receipts Bucket
-- Users can upload
CREATE POLICY "Users can upload own receipts" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their own receipts
CREATE POLICY "Users can view own receipts" ON storage.objects
FOR SELECT USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can view all receipts
CREATE POLICY "Admins can view all receipts" ON storage.objects
FOR SELECT USING (bucket_id = 'receipts' AND public.has_role(auth.uid(), 'admin'));

-- 3. Update marketplace_purchases table
-- Check if table exists first (it should based on code)
CREATE TABLE IF NOT EXISTS public.marketplace_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  product_id UUID REFERENCES public.marketplace_products(id) NOT NULL,
  purchase_price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add new columns
ALTER TABLE public.marketplace_purchases 
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'completed'; -- pending, completed, rejected

-- 4. RLS for marketplace_purchases (ensure users can insert with status='pending')
ALTER TABLE public.marketplace_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert purchases" ON public.marketplace_purchases
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own purchases" ON public.marketplace_purchases
FOR SELECT USING (auth.uid() = user_id);
