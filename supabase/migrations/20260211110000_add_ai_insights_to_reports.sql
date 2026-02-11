-- Migration to add AI Insights and Report Type to Market Reports

-- 1. Add new columns to market_reports
ALTER TABLE public.market_reports 
ADD COLUMN IF NOT EXISTS ai_insights JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT 'weekly' CHECK (report_type IN ('weekly', 'order_book'));

-- 2. Update existing reports to have a default type (if any)
UPDATE public.market_reports SET report_type = 'weekly' WHERE report_type IS NULL;

-- 3. Update the market_reports storage bucket policies (if needed, but usually once is enough)
-- The previous migration already handled the bucket creation.
