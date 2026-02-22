-- Create AI Coach usage tracking table
CREATE TABLE IF NOT EXISTS ai_coach_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    request_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_ai_coach_usage_user_date ON ai_coach_usage(user_id, date);

-- Function to check and increment quota
CREATE OR REPLACE FUNCTION check_ai_coach_quota(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_daily_limit CONSTANT INTEGER := 50; -- 50 requests per day for free users
    v_today DATE := CURRENT_DATE;
    v_current_count INTEGER;
    v_remaining INTEGER;
BEGIN
    -- Get today's count
    SELECT COALESCE(request_count, 0) INTO v_current_count
    FROM ai_coach_usage
    WHERE user_id = p_user_id AND date = v_today;

    -- If no record exists, current count is 0
    v_current_count := COALESCE(v_current_count, 0);
    v_remaining := v_daily_limit - v_current_count;

    RETURN JSONB_BUILD_OBJECT(
        'allowed', v_remaining > 0,
        'remaining', v_remaining,
        'limit', v_daily_limit,
        'reset_at', v_today + INTERVAL '1 day'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record usage
CREATE OR REPLACE FUNCTION record_ai_coach_usage(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_daily_limit CONSTANT INTEGER := 50;
    v_current_count INTEGER;
BEGIN
    -- Get current count
    SELECT COALESCE(request_count, 0) INTO v_current_count
    FROM ai_coach_usage
    WHERE user_id = p_user_id AND date = v_today;

    v_current_count := COALESCE(v_current_count, 0);

    -- Check if limit exceeded
    IF v_current_count >= v_daily_limit THEN
        RETURN FALSE;
    END IF;

    -- Insert or update
    INSERT INTO ai_coach_usage (user_id, date, request_count)
    VALUES (p_user_id, v_today, 1)
    ON CONFLICT (user_id, date)
    DO UPDATE SET request_count = ai_coach_usage.request_count + 1;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON ai_coach_usage TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_ai_coach_quota(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_ai_coach_usage(UUID) TO anon, authenticated;
