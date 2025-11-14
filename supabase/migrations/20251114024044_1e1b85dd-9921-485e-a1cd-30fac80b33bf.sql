-- Atualizar trigger para creditar vendas nas carteiras corretas
CREATE OR REPLACE FUNCTION public.credit_wallet_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  transaction_currency TEXT;
BEGIN
  -- Only process completed transactions with product_id (sales)
  IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'completed' AND NEW.product_id IS NOT NULL) OR
     (TG_OP = 'INSERT' AND NEW.status = 'completed' AND NEW.product_id IS NOT NULL) THEN
    
    -- Get the currency from the transaction
    transaction_currency := COALESCE(NEW.currency, 'AOA');
    
    -- Credit the wallet with matching currency
    UPDATE public.wallets
    SET 
      balance = balance + NEW.amount,
      updated_at = now()
    WHERE user_id = NEW.user_id 
      AND currency = transaction_currency;
    
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to credit wallet on completed sales
DROP TRIGGER IF EXISTS credit_wallet_on_completed_sale ON public.transactions;
CREATE TRIGGER credit_wallet_on_completed_sale
AFTER INSERT OR UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.credit_wallet_on_sale();

-- Atualizar tabela withdrawals para incluir currency
ALTER TABLE public.withdrawals
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'AOA' CHECK (currency IN ('AOA', 'BRL'));

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_withdrawals_currency ON public.withdrawals(currency);

COMMENT ON COLUMN public.withdrawals.currency IS 'Moeda do saque: AOA ou BRL';