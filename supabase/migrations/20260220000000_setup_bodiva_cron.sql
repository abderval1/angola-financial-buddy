```sql
-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the BODIVA auto-sync function
-- Create a cron job to call the function every 1 minute
SELECT cron.schedule(
  'auto-sync-bodiva-job',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := (SELECT value FROM settings WHERE key = 'supabase_url') || '/functions/v1/auto-sync-bodiva',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT value FROM settings WHERE key = 'supabase_service_role_key')
    ),
    body := '{}'::jsonb
  )
  $$
);

-- Note: In many Supabase environments, calling localhost/internal URLs is better:
-- But usually, we need the specific project URL.
-- A more robust way to get the URL is needed if the host header isn't reliable in cron context.
-- Alternatively, hardcode the project ref if known, but using env vars/secrets is better.

-- If the above fails due to auth/URL, one can also use:
-- SELECT net.http_post(url := 'http://localhost:54321/functions/v1/auto-sync-bodiva', ...) if running locally
