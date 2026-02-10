-- Audit System Migration

-- 1. Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g., 'LOGIN', 'VIEW_PAGE', 'UPDATE_PROFILE'
    details JSONB DEFAULT '{}'::jsonb, -- Store dynamic details
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Index for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);

-- 3. RLS Policies
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Users can view their own logs (optional, maybe for account history?)
CREATE POLICY "Users can view own activity logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own logs (via app logic)
CREATE POLICY "Users can insert own activity logs"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 4. Automatic cleanup (optional, keep logs for 1 year?)
-- For now, we keep them indefinitely or use a cron job later.
