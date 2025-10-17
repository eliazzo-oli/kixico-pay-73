-- Add pixel_id column to products table
ALTER TABLE public.products 
ADD COLUMN pixel_id TEXT;