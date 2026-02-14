-- Add loan_date column to loans table
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS loan_date DATE DEFAULT CURRENT_DATE;

-- Add contract_date column to debts table (date when the debt was contracted)
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS contract_date DATE;
