-- Adicionar categoria de Poupança se não existir
INSERT INTO public.transaction_categories (name, type, icon, color, is_default)
SELECT 'Poupança', 'expense', 'PiggyBank', 'blue', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM public.transaction_categories WHERE name = 'Poupança' AND type = 'expense'
);

INSERT INTO public.transaction_categories (name, type, icon, color, is_default)
SELECT 'Resgate de Poupança', 'income', 'Wallet', 'emerald', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM public.transaction_categories WHERE name = 'Resgate de Poupança' AND type = 'income'
);
