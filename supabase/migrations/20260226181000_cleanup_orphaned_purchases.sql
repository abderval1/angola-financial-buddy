-- Clean up orphaned records in marketplace_purchases
-- These are purchases that reference users that no longer exist in profiles

-- Delete marketplace_purchases where user_id doesn't exist in profiles
DELETE FROM public.marketplace_purchases 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Delete marketplace_purchases where product_id doesn't exist in marketplace_products
DELETE FROM public.marketplace_purchases 
WHERE product_id NOT IN (SELECT id FROM public.marketplace_products);

-- Clean up ebook_downloads as well
DELETE FROM public.ebook_downloads 
WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM public.profiles);

DELETE FROM public.ebook_downloads 
WHERE product_id IS NOT NULL AND product_id NOT IN (SELECT id FROM public.marketplace_products);

DELETE FROM public.ebook_downloads 
WHERE subscription_id IS NOT NULL AND subscription_id NOT IN (SELECT id FROM public.user_subscriptions);
