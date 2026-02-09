-- Add current balance to income sources
ALTER TABLE public.income_sources 
ADD COLUMN IF NOT EXISTS current_balance NUMERIC DEFAULT 0;

-- Link transactions to income sources
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS income_source_id UUID REFERENCES public.income_sources(id) ON DELETE SET NULL;

-- Create index for faster history lookup
CREATE INDEX IF NOT EXISTS idx_transactions_income_source_id ON public.transactions(income_source_id);
