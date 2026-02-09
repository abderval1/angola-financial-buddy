-- Add price field to educational_content for premium courses
-- When is_premium = true, the course requires separate payment

-- Add price column to educational_content
ALTER TABLE educational_content
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT NULL;

-- Add comment to explain the field
COMMENT ON COLUMN educational_content.price IS 'Price in Kwanzas for premium courses sold separately (outside subscription plans)';

-- Create a table to track individual course purchases
CREATE TABLE IF NOT EXISTS course_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES educational_content(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Add RLS policies for course_purchases
ALTER TABLE course_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own course purchases"
ON course_purchases FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own purchases
CREATE POLICY "Users can insert own course purchases"
ON course_purchases FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending purchases
CREATE POLICY "Users can update own pending purchases"
ON course_purchases FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);

-- Admins can view all purchases
CREATE POLICY "Admins can view all course purchases"
ON course_purchases FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Admins can update all purchases
CREATE POLICY "Admins can update all course purchases"
ON course_purchases FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_course_purchases_user_id ON course_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_course_purchases_course_id ON course_purchases(course_id);
CREATE INDEX IF NOT EXISTS idx_course_purchases_status ON course_purchases(status);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_course_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_course_purchases_updated_at ON course_purchases;
CREATE TRIGGER trigger_course_purchases_updated_at
  BEFORE UPDATE ON course_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_course_purchases_updated_at();
