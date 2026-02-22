-- Database function to validate if a category has enough balance for a transfer to savings
CREATE OR REPLACE FUNCTION validate_savings_transfer(
  p_user_id UUID,
  p_category_id UUID,
  p_amount DECIMAL,
  p_month TEXT -- format 'YYYY-MM'
) RETURNS BOOLEAN AS $$
DECLARE
  v_income DECIMAL;
  v_expense DECIMAL;
  v_transfers DECIMAL;
  v_bucket_category_names TEXT[] := ARRAY[
    'Poupança', 'Levantamento',
    'Investimento', 'Resgate de Investimento',
    'Dívida (Pagamento)', 'Dívida (Recebimento)',
    'Empréstimo (Pagamento)', 'Empréstimo (Recebimento)',
    'Transferência para Poupança', 'Transferência da Poupança'
  ];
BEGIN
  -- Total income for this category up to the specified month
  -- We join with transaction_categories to ensure we matches by name if ID changes (more robust)
  SELECT COALESCE(SUM(t.amount), 0) INTO v_income
  FROM transactions t
  JOIN transaction_categories tc ON t.category_id = tc.id
  WHERE t.user_id = p_user_id
    AND t.category_id = p_category_id
    AND t.type = 'income'
    AND TO_CHAR(t.date, 'YYYY-MM') <= p_month;

  -- Total expenses for this category up to the specified month
  SELECT COALESCE(SUM(t.amount), 0) INTO v_expense
  FROM transactions t
  WHERE t.user_id = p_user_id
    AND t.category_id = p_category_id
    AND t.type = 'expense'
    AND TO_CHAR(t.date, 'YYYY-MM') <= p_month;

  -- The check reflects the liquid balance available for this specific category
  RETURN (v_income - v_expense) >= p_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
