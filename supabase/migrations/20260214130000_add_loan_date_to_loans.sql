-- Add loan_date column to loans table if not exists
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS loan_date DATE;
