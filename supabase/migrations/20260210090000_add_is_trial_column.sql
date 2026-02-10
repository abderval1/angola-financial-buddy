-- Add is_trial column to user_subscriptions if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'is_trial') THEN
        ALTER TABLE public.user_subscriptions ADD COLUMN is_trial BOOLEAN DEFAULT false;
    END IF;
END $$;
