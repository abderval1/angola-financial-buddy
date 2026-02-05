-- Add reply_to_id for threaded replies in chat_messages
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL;

-- Create table for emoji reactions on chat messages
CREATE TABLE IF NOT EXISTS public.chat_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS on chat_reactions
ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can view reactions
CREATE POLICY "Anyone can view reactions"
ON public.chat_reactions
FOR SELECT
USING (true);

-- Users can add their own reactions
CREATE POLICY "Users can add reactions"
ON public.chat_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "Users can remove their own reactions"
ON public.chat_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Create table for post comments (discussions)
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, emoji)
);

-- Enable RLS on post_reactions
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can view post reactions
CREATE POLICY "Anyone can view post reactions"
ON public.post_reactions
FOR SELECT
USING (true);

-- Users can add their own post reactions
CREATE POLICY "Users can add post reactions"
ON public.post_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own post reactions
CREATE POLICY "Users can remove post reactions"
ON public.post_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Add reply_to_id to post_comments for threaded replies
ALTER TABLE public.post_comments 
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.post_comments(id) ON DELETE SET NULL;

-- Enable realtime for chat reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_reactions;