-- Add source column to investments table to track where funds came from
ALTER TABLE investments 
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'savings' 
CHECK (source IN ('savings', 'budget'));

-- Add comment for documentation
COMMENT ON COLUMN investments.source IS 'Source of funds: savings or budget';
