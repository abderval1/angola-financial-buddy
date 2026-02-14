-- Create loan_collections table to track collection history
CREATE TABLE IF NOT EXISTS loan_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  collection_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE loan_collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own loan collections" ON loan_collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loan collections" ON loan_collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own loan collections" ON loan_collections
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_loan_collections_loan_id ON loan_collections(loan_id);
