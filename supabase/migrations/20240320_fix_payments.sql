
-- Check if the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload proofs
CREATE POLICY "Users can upload payment proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Policy to allow authenticated users to view their own proofs (or public if the bucket is public)
CREATE POLICY "Users can view payment proofs"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'payment-proofs' );

-- Ensure user_subscriptions policies allow insert
-- (Assuming table exists, just adding policy if missing)
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own subscriptions"
ON user_subscriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscriptions"
ON user_subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
