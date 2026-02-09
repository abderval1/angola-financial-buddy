-- Add period column to budget_alerts
ALTER TABLE budget_alerts ADD COLUMN period TEXT DEFAULT 'monthly' CHECK (period IN ('monthly', 'yearly'));

-- Update existing alerts (none should exist yet or they are monthly)
UPDATE budget_alerts SET period = 'monthly' WHERE period IS NULL;
