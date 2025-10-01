-- Add checkout customization columns to products table
ALTER TABLE public.products
ADD COLUMN checkout_background_color TEXT,
ADD COLUMN checkout_text_color TEXT,
ADD COLUMN checkout_button_color TEXT,
ADD COLUMN checkout_timer_enabled BOOLEAN DEFAULT false;