-- Make product_id nullable to allow system transactions without a product (manual adjustments, withdrawals)
ALTER TABLE public.transactions
ALTER COLUMN product_id DROP NOT NULL;