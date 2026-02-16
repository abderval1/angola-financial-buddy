-- Add view count increment function for blog
-- Run this if the tables already exist

-- Function to increment blog view count (for RPC)
CREATE OR REPLACE FUNCTION increment_blog_view_count(p_post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE blog_posts
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql;
