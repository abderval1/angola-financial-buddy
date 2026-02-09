-- Add related_id column to notifications table to fix "column does not exist" error
-- This column seems to be expected by some internal/background processes
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS related_id UUID;

-- Update RLS for the new column (though not strictly necessary as it's just a column)
-- Allow admins to insert notifications with related_id
DROP POLICY IF EXISTS "Admins can insert notifications with related_id" ON public.notifications;
CREATE POLICY "Admins can insert notifications with related_id" ON public.notifications
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
