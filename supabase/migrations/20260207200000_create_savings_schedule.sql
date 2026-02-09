-- Create savings_schedule table
CREATE TABLE IF NOT EXISTS public.savings_schedule (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES public.savings_goals(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    date DATE NOT NULL,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'paid', 'missed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.savings_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own schedule"
    ON public.savings_schedule FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedule"
    ON public.savings_schedule FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedule"
    ON public.savings_schedule FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedule"
    ON public.savings_schedule FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_savings_schedule_updated_at
    BEFORE UPDATE ON public.savings_schedule
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
