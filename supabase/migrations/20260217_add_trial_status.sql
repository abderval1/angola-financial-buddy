-- Add 'trial' as a valid status for user_subscriptions
-- This allows tracking one-time trial activations permanently

ALTER TABLE public.user_subscriptions
  DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;

ALTER TABLE public.user_subscriptions
  ADD CONSTRAINT user_subscriptions_status_check
  CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'trial'));
