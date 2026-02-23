-- Fix RLS policies for user_subscriptions to allow trial subscription inserts
-- This ensures users can insert their own subscriptions including trial plans

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.user_subscriptions;

-- Create new insert policy that allows authenticated users to insert their own subscriptions
-- This includes trial subscriptions
CREATE POLICY "Users can insert own subscriptions" ON public.user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Ensure the table has RLS enabled
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Also add a policy for anon users to view subscription plans
-- (this might be needed for public plan information)
