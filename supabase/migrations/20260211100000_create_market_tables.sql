-- Migration to create Market Management tables

-- 1. Market Indicators
CREATE TABLE IF NOT EXISTS public.market_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    value NUMERIC NOT NULL DEFAULT 0,
    unit TEXT DEFAULT '%',
    change NUMERIC DEFAULT 0,
    trend TEXT CHECK (trend IN ('up', 'down', 'stable')) DEFAULT 'stable',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Market Trends (Analysis)
CREATE TABLE IF NOT EXISTS public.market_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Market Reports (PDFs)
CREATE TABLE IF NOT EXISTS public.market_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Weekly',
    description TEXT,
    file_url TEXT,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.market_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Indicators
CREATE POLICY "Public indicators Select" ON public.market_indicators
    FOR SELECT USING (true);

CREATE POLICY "Admin indicators Full Access" ON public.market_indicators
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- RLS Policies for Trends
CREATE POLICY "Public trends Select" ON public.market_trends
    FOR SELECT USING (true);

CREATE POLICY "Admin trends Full Access" ON public.market_trends
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- RLS Policies for Reports
CREATE POLICY "Public reports Select" ON public.market_reports
    FOR SELECT USING (true); -- We rely on ModuleGuard for page access, but keep select public for simplicity or we can restrict to subscribers

CREATE POLICY "Admin reports Full Access" ON public.market_reports
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Storage Bucket for Reports
-- Note: SQL-based storage creation might not work in all environments, but this is the standard way.
INSERT INTO storage.buckets (id, name, public) VALUES ('market_reports', 'market_reports', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public report access" ON storage.objects
    FOR SELECT USING (bucket_id = 'market_reports');

CREATE POLICY "Admin report upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'market_reports' AND 
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admin report delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'market_reports' AND 
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    );
