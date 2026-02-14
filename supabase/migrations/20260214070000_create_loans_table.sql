-- Create table for loans given to others (money owed to user)
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    borrower_name TEXT NOT NULL,
    borrower_contact TEXT,
    original_amount NUMERIC(15,2) NOT NULL,
    current_amount NUMERIC(15,2) NOT NULL,
    interest_rate NUMERIC(5,2) DEFAULT 0,
    expected_return_date DATE,
    actual_return_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'defaulted')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Users can manage their own loans" ON public.loans
    FOR ALL USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER loans_updated_at
    BEFORE UPDATE ON public.loans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
