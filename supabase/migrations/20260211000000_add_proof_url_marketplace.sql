-- Ensure receipt_url exists in marketplace_purchases

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'marketplace_purchases' 
        AND column_name = 'receipt_url'
    ) THEN
        ALTER TABLE marketplace_purchases ADD COLUMN receipt_url TEXT;
    END IF;
END $$;
