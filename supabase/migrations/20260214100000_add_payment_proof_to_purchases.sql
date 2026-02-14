-- Add payment_proof_url column to marketplace_purchases if not exists
ALTER TABLE marketplace_purchases 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- Also add status column if not exists
ALTER TABLE marketplace_purchases 
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_status ON marketplace_purchases(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_user_status ON marketplace_purchases(user_id, status);
