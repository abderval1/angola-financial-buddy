-- Add blog comment reactions table
CREATE TABLE IF NOT EXISTS blog_comment_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES blog_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    reaction VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id, reaction)
);

-- Enable RLS
ALTER TABLE blog_comment_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own reactions" ON blog_comment_reactions
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Anyone can view reactions" ON blog_comment_reactions
    FOR SELECT USING (true);
