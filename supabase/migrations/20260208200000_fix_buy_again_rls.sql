-- Allow users to update their own marketplace purchases
-- This is specifically needed for the "Buy Again" feature when a purchase is rejected
DROP POLICY IF EXISTS "Users can update own purchases" ON public.marketplace_purchases;
CREATE POLICY "Users can update own purchases" ON public.marketplace_purchases
FOR UPDATE USING (auth.uid() = user_id);
