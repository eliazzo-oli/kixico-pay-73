-- Add Order Bump columns to products table
ALTER TABLE public.products
ADD COLUMN order_bump_enabled BOOLEAN DEFAULT false,
ADD COLUMN order_bump_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
ADD COLUMN order_bump_price NUMERIC,
ADD COLUMN order_bump_headline TEXT;