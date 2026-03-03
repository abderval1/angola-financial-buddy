-- Create investment_transactions table to track all investment movements
CREATE TABLE public.investment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    investment_id UUID REFERENCES public.investments(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('investment', 'withdrawal', 'reinforcement', 'return', 'market_adjustment', 'dividend')),
    amount NUMERIC(15,2) NOT NULL,
    previous_value NUMERIC(15,2),
    new_value NUMERIC(15,2),
    source VARCHAR(20) CHECK (source IN ('savings', 'budget', 'income', 'other')),
    destination VARCHAR(20) CHECK (destination IN ('savings', 'budget', 'bank_account', 'other')),
    notes TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own investment transactions" 
ON public.investment_transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investment transactions" 
ON public.investment_transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own investment transactions" 
ON public.investment_transactions FOR DELETE 
USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_investment_transactions_investment_id 
ON public.investment_transactions(investment_id);

CREATE INDEX idx_investment_transactions_user_id 
ON public.investment_transactions(user_id);

CREATE INDEX idx_investment_transactions_date 
ON public.investment_transactions(transaction_date);

-- Add comment
COMMENT ON TABLE public.investment_transactions IS 'Histórico de transações de investimentos: depósitos, levantamentos, refuerços, ganhos, etc.';
