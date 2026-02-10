-- Add approved_at and approved_by to marketplace_purchases

DO $$
BEGIN
    -- Add approved_at
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'marketplace_purchases' 
        AND column_name = 'approved_at'
    ) THEN
        ALTER TABLE marketplace_purchases ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add approved_by
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'marketplace_purchases' 
        AND column_name = 'approved_by'
    ) THEN
        ALTER TABLE marketplace_purchases ADD COLUMN approved_by UUID REFERENCES auth.users(id);
    END IF;
END $$;
