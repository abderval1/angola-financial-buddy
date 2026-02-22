-- Increase character limits for BODIVA market data fields
-- Some imported data from Excel may exceed the original 50/100 character limits

ALTER TABLE bodiva_market_data 
ALTER COLUMN symbol TYPE VARCHAR(255),
ALTER COLUMN title_type TYPE VARCHAR(255);
