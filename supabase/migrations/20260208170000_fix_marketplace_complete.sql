-- 1. Create Receipts Bucket (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Receipts Policies (Drop first to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to Receipts" ON storage.objects;

CREATE POLICY "Users can upload own receipts" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own receipts" ON storage.objects
FOR SELECT USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all receipts" ON storage.objects
FOR SELECT USING (bucket_id = 'receipts' AND public.has_role(auth.uid(), 'admin'));

-- 3. Marketplace Purchases Table Updates
-- Ensure columns exist
ALTER TABLE public.marketplace_purchases 
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'completed';

-- 4. Fix Foreign Key (Clean up orphans first)
-- Delete purchases where user_id does not exist in profiles
DELETE FROM public.marketplace_purchases
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Drop constraint if exists to ensure clean state
ALTER TABLE public.marketplace_purchases
DROP CONSTRAINT IF EXISTS marketplace_purchases_user_id_fkey_profiles;

-- Add constraint back
ALTER TABLE public.marketplace_purchases
ADD CONSTRAINT marketplace_purchases_user_id_fkey_profiles
FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- 5. RLS for Marketplace Purchases
ALTER TABLE public.marketplace_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert purchases" ON public.marketplace_purchases;
DROP POLICY IF EXISTS "Users can view own purchases" ON public.marketplace_purchases;

CREATE POLICY "Users can insert purchases" ON public.marketplace_purchases
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own purchases" ON public.marketplace_purchases
FOR SELECT USING (auth.uid() = user_id);

-- 6. Marketplace Products RLS (Ensure readability)
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published products" ON public.marketplace_products;
CREATE POLICY "Anyone can view published products" ON public.marketplace_products
FOR SELECT USING (true);
