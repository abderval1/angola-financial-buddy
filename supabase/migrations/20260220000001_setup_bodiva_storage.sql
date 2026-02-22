-- Create a storage bucket for BODIVA imports if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('bodiva_imports', 'bodiva_imports', false)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the bucket
-- Allow administrators (or authenticated users for now, simplify for testing) to upload/read/delete
DO $$
BEGIN
    -- Policy for authenticated users to upload
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload imports'
    ) THEN
        CREATE POLICY "Authenticated users can upload imports"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'bodiva_imports');
    END IF;

    -- Policy for authenticated users to select
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can read imports'
    ) THEN
        CREATE POLICY "Authenticated users can read imports"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'bodiva_imports');
    END IF;

    -- Policy for authenticated users to delete
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete imports'
    ) THEN
        CREATE POLICY "Authenticated users can delete imports"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'bodiva_imports');
    END IF;
END $$;
