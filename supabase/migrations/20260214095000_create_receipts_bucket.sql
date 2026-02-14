-- Create receipts storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO UPDATE SET public = true, name = 'receipts';

-- Storage policies for receipts
DROP POLICY IF EXISTS "Users can upload own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all receipts" ON storage.objects;

-- Allow authenticated users to upload receipts
CREATE POLICY "Users can upload own receipts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own receipts
CREATE POLICY "Users can view own receipts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view all receipts (for admin)
CREATE POLICY "Authenticated can view all receipts" ON storage.objects
FOR SELECT USING (bucket_id = 'receipts');
