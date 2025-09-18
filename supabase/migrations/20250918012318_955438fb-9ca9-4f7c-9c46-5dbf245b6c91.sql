-- Remover constraints restritivas e adicionar novas mais flexíveis
ALTER TABLE public.transactions DROP CONSTRAINT transactions_amount_check;
ALTER TABLE public.transactions DROP CONSTRAINT transactions_payment_method_check;

-- Permitir valores negativos para saques e ajustes de débito
ALTER TABLE public.transactions ADD CONSTRAINT transactions_amount_check 
  CHECK (amount IS NOT NULL);

-- Adicionar métodos de pagamento para saques e ajustes manuais  
ALTER TABLE public.transactions ADD CONSTRAINT transactions_payment_method_check 
  CHECK (payment_method = ANY (ARRAY[
    'card'::text, 
    'pix'::text, 
    'bank_transfer'::text, 
    'mobile_money'::text,
    'saque'::text,
    'credito'::text, 
    'debito'::text
  ]));