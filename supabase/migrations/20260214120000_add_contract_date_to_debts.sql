-- Add contract_date column to debts table if not exists
ALTER TABLE debts 
ADD COLUMN IF NOT EXISTS contract_date DATE;
