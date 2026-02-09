-- Add savings_goal_id to transactions to link them to specific goals
ALTER TABLE public.transactions ADD COLUMN savings_goal_id UUID REFERENCES public.savings_goals(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_transactions_savings_goal_id ON public.transactions(savings_goal_id);
