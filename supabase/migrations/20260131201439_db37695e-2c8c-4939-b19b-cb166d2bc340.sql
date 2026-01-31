-- ============================================================
-- KUANZA FINANCE PLATFORM - DATABASE EVOLUTION
-- New tables for Goals, Education, Community, Challenges, Extra Income, Reports
-- ============================================================

-- Create enum for goal priority
CREATE TYPE public.goal_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Create enum for goal status
CREATE TYPE public.goal_status AS ENUM ('active', 'completed', 'paused', 'cancelled');

-- Create enum for challenge status
CREATE TYPE public.challenge_status AS ENUM ('upcoming', 'active', 'completed', 'expired');

-- Create enum for content type
CREATE TYPE public.content_type AS ENUM ('article', 'video', 'course', 'quiz', 'calculator');

-- Create enum for business type
CREATE TYPE public.business_type AS ENUM ('side_hustle', 'freelance', 'small_business', 'investment', 'passive_income');

-- ============================================================
-- FINANCIAL GOALS TABLE (FIRE Method Support)
-- ============================================================
CREATE TABLE public.financial_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount NUMERIC NOT NULL,
    current_amount NUMERIC DEFAULT 0,
    monthly_contribution NUMERIC DEFAULT 0,
    goal_type VARCHAR(100) NOT NULL, -- emergency_fund, retirement, house, car, education, travel, fire_number, etc.
    priority goal_priority DEFAULT 'medium',
    status goal_status DEFAULT 'active',
    target_date DATE,
    icon VARCHAR(50),
    color VARCHAR(50),
    is_fire_goal BOOLEAN DEFAULT false,
    fire_type VARCHAR(50), -- lean, regular, fat, coast
    annual_expenses NUMERIC, -- For FIRE calculation
    safe_withdrawal_rate NUMERIC DEFAULT 4, -- SWR percentage
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" ON public.financial_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON public.financial_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.financial_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.financial_goals
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- EDUCATIONAL CONTENT TABLE
-- ============================================================
CREATE TABLE public.educational_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    content TEXT,
    content_type content_type NOT NULL,
    category VARCHAR(100) NOT NULL, -- budgeting, savings, investing, debt, bodiva, stocks, business, fire
    difficulty_level VARCHAR(50) DEFAULT 'beginner', -- beginner, intermediate, advanced
    duration_minutes INTEGER,
    thumbnail_url TEXT,
    video_url TEXT,
    points_reward INTEGER DEFAULT 10,
    is_premium BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.educational_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published content" ON public.educational_content
    FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage content" ON public.educational_content
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================
-- USER CONTENT PROGRESS TABLE
-- ============================================================
CREATE TABLE public.user_content_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    content_id UUID NOT NULL REFERENCES public.educational_content(id) ON DELETE CASCADE,
    progress_percentage INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    quiz_score INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

ALTER TABLE public.user_content_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON public.user_content_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.user_content_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_content_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- CHALLENGES TABLE
-- ============================================================
CREATE TABLE public.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    challenge_type VARCHAR(100) NOT NULL, -- savings, spending, learning, investment
    target_value NUMERIC, -- Target amount or count
    target_metric VARCHAR(100), -- amount_saved, days_no_spending, lessons_completed
    duration_days INTEGER NOT NULL,
    start_date DATE,
    end_date DATE,
    points_reward INTEGER DEFAULT 50,
    badge_reward VARCHAR(100),
    icon VARCHAR(50),
    difficulty VARCHAR(50) DEFAULT 'medium',
    max_participants INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active challenges" ON public.challenges
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage challenges" ON public.challenges
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================
-- USER CHALLENGES TABLE
-- ============================================================
CREATE TABLE public.user_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    status challenge_status DEFAULT 'active',
    current_progress NUMERIC DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    points_earned INTEGER DEFAULT 0,
    notes TEXT,
    UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenges" ON public.user_challenges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges" ON public.user_challenges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges" ON public.user_challenges
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- EXTRA INCOME / SIDE BUSINESS TABLE
-- ============================================================
CREATE TABLE public.income_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    business_type business_type NOT NULL,
    category VARCHAR(100), -- e-commerce, services, investments, freelance, rentals
    monthly_revenue NUMERIC DEFAULT 0,
    monthly_expenses NUMERIC DEFAULT 0,
    initial_investment NUMERIC DEFAULT 0,
    start_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.income_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own income sources" ON public.income_sources
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income sources" ON public.income_sources
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income sources" ON public.income_sources
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own income sources" ON public.income_sources
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- FINANCIAL REPORTS TABLE
-- ============================================================
CREATE TABLE public.financial_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    report_type VARCHAR(100) NOT NULL, -- monthly, quarterly, yearly, custom
    report_name VARCHAR(255) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    data JSONB NOT NULL, -- Store report data as JSON
    file_url TEXT, -- PDF storage URL
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports" ON public.financial_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON public.financial_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports" ON public.financial_reports
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- COMMUNITY POSTS TABLE
-- ============================================================
CREATE TABLE public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100), -- tips, questions, success_story, discussion
    tags TEXT[],
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved posts" ON public.community_posts
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can insert own posts" ON public.community_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.community_posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.community_posts
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- POST COMMENTS TABLE
-- ============================================================
CREATE TABLE public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved comments" ON public.post_comments
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can insert own comments" ON public.post_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.post_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.post_comments
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- USER GAMIFICATION STATS TABLE
-- ============================================================
CREATE TABLE public.user_gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    total_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    level_name VARCHAR(100) DEFAULT 'Iniciante',
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    challenges_completed INTEGER DEFAULT 0,
    lessons_completed INTEGER DEFAULT 0,
    goals_achieved INTEGER DEFAULT 0,
    rank_position INTEGER,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all gamification stats" ON public.user_gamification
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own stats" ON public.user_gamification
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats" ON public.user_gamification
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- MARKET DATA CACHE TABLE (For API data from BNA, BODIVA, etc.)
-- ============================================================
CREATE TABLE public.market_data_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(100) NOT NULL, -- bna, bodiva, bai, bfa, emis
    data_type VARCHAR(100) NOT NULL, -- exchange_rate, interest_rate, stock_price, bond_yield
    symbol VARCHAR(50),
    data JSONB NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.market_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view market data" ON public.market_data_cache
    FOR SELECT USING (true);

CREATE POLICY "System can insert market data" ON public.market_data_cache
    FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================
CREATE TRIGGER update_financial_goals_updated_at
    BEFORE UPDATE ON public.financial_goals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_educational_content_updated_at
    BEFORE UPDATE ON public.educational_content
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_content_progress_updated_at
    BEFORE UPDATE ON public.user_content_progress
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at
    BEFORE UPDATE ON public.challenges
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_income_sources_updated_at
    BEFORE UPDATE ON public.income_sources
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at
    BEFORE UPDATE ON public.community_posts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at
    BEFORE UPDATE ON public.post_comments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_gamification_updated_at
    BEFORE UPDATE ON public.user_gamification
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- UPDATE handle_new_user FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (user_id, name, email)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'name', NEW.email);
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    -- Create financial profile
    INSERT INTO public.financial_profiles (user_id)
    VALUES (NEW.id);
    
    -- Create gamification stats
    INSERT INTO public.user_gamification (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$;