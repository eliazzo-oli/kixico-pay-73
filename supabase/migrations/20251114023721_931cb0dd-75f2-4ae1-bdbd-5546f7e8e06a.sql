-- Adicionar currency à tabela products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'AOA' CHECK (currency IN ('AOA', 'BRL'));

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_products_currency ON public.products(currency);

-- Adicionar comentário
COMMENT ON COLUMN public.products.currency IS 'Moeda do produto: AOA (Kwanza Angolano) ou BRL (Real Brasileiro)';

-- Garantir que todos os usuários têm carteiras AOA e BRL
INSERT INTO public.wallets (user_id, currency, balance)
SELECT p.user_id, 'AOA', COALESCE(p.balance, 0)
FROM public.profiles p
ON CONFLICT (user_id, currency) DO NOTHING;

INSERT INTO public.wallets (user_id, currency, balance)
SELECT p.user_id, 'BRL', 0
FROM public.profiles p
ON CONFLICT (user_id, currency) DO NOTHING;