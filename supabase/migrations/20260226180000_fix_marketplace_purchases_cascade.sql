-- Fix foreign key constraints to allow CASCADE delete
-- This allows deleting users from profiles table to automatically delete related records

-- Drop existing foreign key constraints if they exist
ALTER TABLE public.marketplace_purchases 
DROP CONSTRAINT IF EXISTS marketplace_purchases_user_id_fkey;

ALTER TABLE public.marketplace_purchases 
DROP CONSTRAINT IF EXISTS marketplace_purchases_product_id_fkey;

-- Add new foreign keys with CASCADE delete
ALTER TABLE public.marketplace_purchases 
ADD CONSTRAINT marketplace_purchases_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.marketplace_purchases 
ADD CONSTRAINT marketplace_purchases_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.marketplace_products(id) ON DELETE CASCADE;

-- Also fix ebook_downloads table
ALTER TABLE public.ebook_downloads 
DROP CONSTRAINT IF EXISTS ebook_downloads_user_id_fkey;

ALTER TABLE public.ebook_downloads 
DROP CONSTRAINT IF EXISTS ebook_downloads_product_id_fkey;

ALTER TABLE public.ebook_downloads 
DROP CONSTRAINT IF EXISTS ebook_downloads_subscription_id_fkey;

ALTER TABLE public.ebook_downloads 
ADD CONSTRAINT ebook_downloads_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.ebook_downloads 
ADD CONSTRAINT ebook_downloads_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.marketplace_products(id) ON DELETE CASCADE;

ALTER TABLE public.ebook_downloads 
ADD CONSTRAINT ebook_downloads_subscription_id_fkey 
FOREIGN KEY (subscription_id) REFERENCES public.user_subscriptions(id) ON DELETE CASCADE;
