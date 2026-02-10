-- Restore admin policy for marketplace_products that was accidentally dropped
-- This allows admins to view ALL products (published and unpublished)

DROP POLICY IF EXISTS "Admins can manage products" ON public.marketplace_products;
CREATE POLICY "Admins can manage products" ON public.marketplace_products
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
