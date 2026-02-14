-- Enable RLS on loans table
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own loans
CREATE POLICY "Users can view own loans" ON loans
FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own loans
CREATE POLICY "Users can insert own loans" ON loans
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own loans
CREATE POLICY "Users can update own loans" ON loans
FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own loans
CREATE POLICY "Users can delete own loans" ON loans
FOR DELETE USING (auth.uid() = user_id);
