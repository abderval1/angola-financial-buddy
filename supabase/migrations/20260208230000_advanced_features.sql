-- Tables for Advanced Tier (Market & News)
CREATE TABLE IF NOT EXISTS market_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL DEFAULT '%',
    change NUMERIC DEFAULT 0,
    trend TEXT DEFAULT 'stable',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    category TEXT DEFAULT 'Weekly'
);

-- Seed initial indicators
INSERT INTO market_indicators (name, value, unit, change, trend) VALUES
('Taxa BNA', 19.5, '%', 0.5, 'up'),
('Inflação (Mensal)', 2.4, '%', -0.1, 'down'),
('LUIBOR Overnight', 18.25, '%', 0.1, 'up'),
('Taxa de Câmbio (USD/AOA)', 830, 'Kz', 2.1, 'up')
ON CONFLICT (name) DO UPDATE SET 
    value = EXCLUDED.value,
    change = EXCLUDED.change,
    trend = EXCLUDED.trend,
    updated_at = NOW();

-- Enable RLS
ALTER TABLE market_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_reports ENABLE ROW LEVEL SECURITY;

-- Select policies (Public or based on tier?)
-- Since we use ModuleGuard on the frontend, we can allow authenticated users to select, 
-- but we might want to restrict at the policy level too if we want true "Advanced Tier Only" data protection.
-- However, for simple implementation, we'll allow all authenticated and then let has_module_access handle it.

CREATE POLICY "Allow public select for market_indicators" ON market_indicators
    FOR SELECT USING (true);

CREATE POLICY "Allow public select for market_reports" ON market_reports
    FOR SELECT USING (true);

-- Admin policies
CREATE POLICY "Allow admin manage market_indicators" ON market_indicators
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin manage market_reports" ON market_reports
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
