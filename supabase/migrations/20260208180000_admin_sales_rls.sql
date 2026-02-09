-- Add RLS policies for Administrators on marketplace_purchases and notifications
-- This allows admins to approve/reject purchases AND send notifications to users

-- 1. Policies for marketplace_purchases
DROP POLICY IF EXISTS "Admins can view all purchases" ON public.marketplace_purchases;
CREATE POLICY "Admins can view all purchases" ON public.marketplace_purchases
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update purchases" ON public.marketplace_purchases;
CREATE POLICY "Admins can update purchases" ON public.marketplace_purchases
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete purchases" ON public.marketplace_purchases;
CREATE POLICY "Admins can delete purchases" ON public.marketplace_purchases
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- 2. Policies for notifications (Allow admins to send notifications)
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications" ON public.notifications
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
