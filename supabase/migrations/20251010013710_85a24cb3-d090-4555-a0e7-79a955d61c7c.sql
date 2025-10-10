-- Add accepted_payment_methods column to products table
ALTER TABLE public.products 
ADD COLUMN accepted_payment_methods TEXT[] DEFAULT NULL;

COMMENT ON COLUMN public.products.accepted_payment_methods IS 'Lista de métodos de pagamento aceitos para este produto. Se NULL, todos os métodos estão disponíveis.';
