-- Create table to cache BODIVA statistics
CREATE TABLE IF NOT EXISTS bodiva_cache (
  id TEXT PRIMARY KEY DEFAULT 'current',
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bodiva_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to bodiva_cache" 
  ON bodiva_cache FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- Allow service role write access
CREATE POLICY "Allow service role to update bodiva_cache" 
  ON bodiva_cache FOR ALL 
  TO service_role 
  USING (true)
  WITH CHECK (true);

-- Insert initial data
INSERT INTO bodiva_cache (id, data, updated_at) 
VALUES (
  'current',
  '{
    "indices": {
      "All Share Index": {"value": 1850.42, "change": 1.25, "changePercent": 0.07},
      "BODIVA 20": {"value": 2450.85, "change": -15.30, "changePercent": -0.62},
      "BODIVA PME": {"value": 890.12, "change": 5.45, "changePercent": 0.62}
    },
    "volumes": {
      "daily": {"volume": 1250000000, "transactions": 342, "tradedShares": 2500000},
      "monthly": {"volume": 28500000000, "transactions": 7850, "tradedShares": 52000000},
      "yearly": {"volume": 342000000000, "transactions": 94200, "tradedShares": 624000000}
    },
    "capitalization": {
      "total": 4500000000000,
      "stocks": 2800000000000,
      "bonds": 1500000000000,
      "other": 200000000000
    },
    "topSecurities": [
      {"symbol": "BAY", "name": "Banco Atlântico", "volume": 450000000, "change": 2.5},
      {"symbol": "SGC", "name": "SG Coloid", "volume": 320000000, "change": -1.2},
      {"symbol": "FIP", "name": "FIP - Imobiliário", "volume": 280000000, "change": 0.8},
      {"symbol": "ENL", "name": "Endiama", "volume": 180000000, "change": 3.1},
      {"symbol": "AFA", "name": "Afrigroup", "volume": 150000000, "change": -0.5}
    ]
  }'::jsonb,
  NOW()
)
ON CONFLICT (id) DO NOTHING;
