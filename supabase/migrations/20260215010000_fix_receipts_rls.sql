-- Fix RLS policy for receipts storage bucket
-- The current policy might be too restrictive

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can view all receipts" ON storage.objects;

-- Allow ALL authenticated users to upload receipts (more permissive)
-- This allows users to upload to their own folder (user_id/filename)
CREATE POLICY "Users can upload receipts" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own receipts
CREATE POLICY "Users can view own receipts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'receipts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view all receipts (for admin)
CREATE POLICY "Authenticated can view all receipts" ON storage.objects
FOR SELECT USING (bucket_id = 'receipts');

-- Allow public read access to receipts (for displaying proof of payment)
CREATE POLICY "Public can view receipts" ON storage.objects
FOR SELECT USING (bucket_id = 'receipts');
