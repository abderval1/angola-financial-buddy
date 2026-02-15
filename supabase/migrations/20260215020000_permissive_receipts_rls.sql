-- Fix RLS policy for receipts storage bucket - make it fully permissive for authenticated users
-- This allows any authenticated user to upload to any folder

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can view all receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload receipts" ON storage.objects;

-- Allow ALL authenticated users to upload to receipts bucket
CREATE POLICY "Anyone authenticated can upload receipts" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipts');

-- Allow ALL authenticated users to select (view/download) from receipts bucket
CREATE POLICY "Anyone authenticated can view receipts" ON storage.objects
FOR SELECT USING (bucket_id = 'receipts');

-- Allow ALL authenticated users to update receipts
CREATE POLICY "Anyone authenticated can update receipts" ON storage.objects
FOR UPDATE USING (bucket_id = 'receipts');

-- Allow ALL authenticated users to delete receipts
CREATE POLICY "Anyone authenticated can delete receipts" ON storage.objects
FOR DELETE USING (bucket_id = 'receipts');
