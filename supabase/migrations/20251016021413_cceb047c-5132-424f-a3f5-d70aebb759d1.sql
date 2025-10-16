-- Add checkout_show_kixicopay_logo to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS checkout_show_kixicopay_logo boolean NOT NULL DEFAULT true;