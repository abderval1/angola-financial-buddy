-- Add last_updated timestamp to track when BODIVA data was last synced
ALTER TABLE bodiva_market_data 
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ DEFAULT NOW();

-- Create a separate table to track sync metadata
CREATE TABLE IF NOT EXISTS bodiva_sync_log (
  id BIGSERIAL PRIMARY KEY,
  sync_date DATE NOT NULL,
  records_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sync_date)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_bodiva_sync_log_date ON bodiva_sync_log(sync_date DESC);
