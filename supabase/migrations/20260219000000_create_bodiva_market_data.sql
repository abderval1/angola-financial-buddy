-- Create table for BODIVA market data history
-- This allows manual upload of market data for historical tracking and ML predictions

CREATE TABLE IF NOT EXISTS bodiva_market_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_date DATE NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    title_type VARCHAR(100) NOT NULL,
    price DECIMAL(18,2) NOT NULL,
    variation DECIMAL(8,4) NOT NULL DEFAULT 0,
    num_trades INTEGER DEFAULT 0,
    quantity BIGINT DEFAULT 0,
    amount DECIMAL(18,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(data_date, symbol)
);

-- Enable RLS
ALTER TABLE bodiva_market_data ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to bodiva_market_data" 
ON bodiva_market_data FOR SELECT 
TO authenticated 
USING (true);

-- Allow admin full access
CREATE POLICY "Allow admin full access to bodiva_market_data" 
ON bodiva_market_data FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Allow service role full access
CREATE POLICY "Allow service role full access to bodiva_market_data" 
ON bodiva_market_data FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bodiva_market_data_date ON bodiva_market_data(data_date DESC);
CREATE INDEX IF NOT EXISTS idx_bodiva_market_data_symbol ON bodiva_market_data(symbol);
