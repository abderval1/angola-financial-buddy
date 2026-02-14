-- Add status column to marketplace_purchases table
ALTER TABLE marketplace_purchases 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_status ON marketplace_purchases(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_user_status ON marketplace_purchases(user_id, status);
