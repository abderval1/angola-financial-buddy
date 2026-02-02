-- Create news table for storing fetched news articles
CREATE TABLE public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  source TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'economia',
  url TEXT,
  image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user news favorites table
CREATE TABLE public.user_news_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, news_id)
);

-- Enable RLS
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_news_favorites ENABLE ROW LEVEL SECURITY;

-- RLS policies for news (public read for approved news)
CREATE POLICY "Anyone can view approved news" 
ON public.news 
FOR SELECT 
USING (is_approved = true);

CREATE POLICY "Admins can manage all news" 
ON public.news 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for favorites
CREATE POLICY "Users can view their own favorites" 
ON public.user_news_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites" 
ON public.user_news_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites" 
ON public.user_news_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_news_category ON public.news(category);
CREATE INDEX idx_news_source ON public.news(source);
CREATE INDEX idx_news_published_at ON public.news(published_at DESC);
CREATE INDEX idx_news_is_approved ON public.news(is_approved);
CREATE INDEX idx_user_news_favorites_user ON public.user_news_favorites(user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_news_updated_at
BEFORE UPDATE ON public.news
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for news
ALTER PUBLICATION supabase_realtime ADD TABLE public.news;