
-- Create market_trends table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.market_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.market_trends ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access for market_trends" ON public.market_trends
    FOR SELECT USING (true);

CREATE POLICY "Admin write access for market_trends" ON public.market_trends
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Insert initial trend analysis if table is empty
INSERT INTO public.market_trends (content)
SELECT 'O mercado financeiro angolano demonstra sinais de estabilização pós-reformas do BNA. A LUIBOR tem acompanhado a taxa de referência, enquanto a inflação apresenta um abrandamento ligeiro mas consistente. Recomendamos cautela em investimentos de longo prazo expostos a variação cambial.'
WHERE NOT EXISTS (SELECT 1 FROM public.market_trends);

-- Function to get latest trend
CREATE OR REPLACE FUNCTION public.get_latest_market_trend()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', id,
        'content', content,
        'updated_at', updated_at
    )
    INTO result
    FROM public.market_trends
    ORDER BY updated_at DESC
    LIMIT 1;
    
    RETURN result;
END;
$$;
