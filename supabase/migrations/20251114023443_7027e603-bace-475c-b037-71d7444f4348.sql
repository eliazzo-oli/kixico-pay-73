-- Fase 1: Criar tabela de carteiras multi-moeda
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL CHECK (currency IN ('AOA', 'BRL')),
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, currency)
);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies para wallets
CREATE POLICY "Users can view their own wallets"
ON public.wallets
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets"
ON public.wallets
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create wallets"
ON public.wallets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
ON public.wallets
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all wallets"
ON public.wallets
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Adicionar currency às transações
ALTER TABLE public.transactions
ADD COLUMN currency TEXT NOT NULL DEFAULT 'AOA';

-- Criar índices para performance
CREATE INDEX idx_wallets_user_currency ON public.wallets(user_id, currency);
CREATE INDEX idx_transactions_currency ON public.transactions(currency);

-- Função para criar carteiras automaticamente para novos usuários
CREATE OR REPLACE FUNCTION public.create_user_wallets()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar carteira AOA
  INSERT INTO public.wallets (user_id, currency, balance)
  VALUES (NEW.id, 'AOA', 0);
  
  -- Criar carteira BRL
  INSERT INTO public.wallets (user_id, currency, balance)
  VALUES (NEW.id, 'BRL', 0);
  
  RETURN NEW;
END;
$$;

-- Trigger para criar carteiras quando um usuário é criado
CREATE TRIGGER on_user_created_wallets
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_user_wallets();

-- Migrar saldos existentes para carteiras AOA
INSERT INTO public.wallets (user_id, currency, balance)
SELECT user_id, 'AOA', COALESCE(balance, 0)
FROM public.profiles
ON CONFLICT (user_id, currency) DO UPDATE SET balance = EXCLUDED.balance;

-- Criar carteiras BRL para usuários existentes
INSERT INTO public.wallets (user_id, currency, balance)
SELECT user_id, 'BRL', 0
FROM public.profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.wallets 
  WHERE wallets.user_id = profiles.user_id AND wallets.currency = 'BRL'
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar comentários
COMMENT ON TABLE public.wallets IS 'Carteiras multi-moeda dos usuários (AOA e BRL)';
COMMENT ON COLUMN public.wallets.currency IS 'Moeda da carteira: AOA (Kwanza) ou BRL (Real)';
COMMENT ON COLUMN public.transactions.currency IS 'Moeda da transação: AOA ou BRL';