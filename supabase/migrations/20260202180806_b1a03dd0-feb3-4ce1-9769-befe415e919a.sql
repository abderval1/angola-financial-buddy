-- Create table for users to follow/track products
CREATE TABLE public.user_product_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.price_products(id) ON DELETE CASCADE,
  product_name TEXT, -- For custom products not in catalog
  lowest_price_seen NUMERIC(12,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id),
  UNIQUE(user_id, product_name)
);

-- Enable RLS
ALTER TABLE public.user_product_follows ENABLE ROW LEVEL SECURITY;

-- Users can see their own follows
CREATE POLICY "Users can view their own product follows"
  ON public.user_product_follows FOR SELECT
  USING (auth.uid() = user_id);

-- Users can follow products
CREATE POLICY "Users can follow products"
  ON public.user_product_follows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unfollow products
CREATE POLICY "Users can unfollow products"
  ON public.user_product_follows FOR DELETE
  USING (auth.uid() = user_id);

-- Users can update their follows
CREATE POLICY "Users can update their follows"
  ON public.user_product_follows FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to check for lower prices and notify followers
CREATE OR REPLACE FUNCTION public.notify_price_drop()
RETURNS TRIGGER AS $$
DECLARE
  follower RECORD;
  product_title TEXT;
  store_title TEXT;
BEGIN
  -- Get product name
  IF NEW.product_id IS NOT NULL THEN
    SELECT name INTO product_title FROM public.price_products WHERE id = NEW.product_id;
  ELSE
    product_title := NEW.product_name;
  END IF;
  
  -- Get store name
  IF NEW.store_id IS NOT NULL THEN
    SELECT name INTO store_title FROM public.stores WHERE id = NEW.store_id;
  ELSE
    store_title := NEW.store_name;
  END IF;

  -- Find all users following this product who have seen a higher price
  FOR follower IN
    SELECT upf.user_id, upf.lowest_price_seen, upf.id as follow_id
    FROM public.user_product_follows upf
    WHERE (upf.product_id = NEW.product_id OR upf.product_name = NEW.product_name)
      AND upf.user_id != NEW.user_id
      AND (upf.lowest_price_seen IS NULL OR NEW.price < upf.lowest_price_seen)
  LOOP
    -- Create notification for the follower
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
    
    -- Update the lowest price seen for this follower
    UPDATE public.user_product_follows
    SET lowest_price_seen = NEW.price
    WHERE id = follower.follow_id;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on price_entries
CREATE TRIGGER trigger_notify_price_drop
  AFTER INSERT ON public.price_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_price_drop();