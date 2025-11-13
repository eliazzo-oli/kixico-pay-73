-- Add new columns to products table for delivery and support
ALTER TABLE public.products 
ADD COLUMN product_delivery_link TEXT,
ADD COLUMN seller_support_contact TEXT,
ADD COLUMN product_category TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.products.product_delivery_link IS 'URL do produto (e-book, grupo WhatsApp, etc.) enviado ao cliente após pagamento';
COMMENT ON COLUMN public.products.seller_support_contact IS 'E-mail ou WhatsApp de suporte do vendedor exibido ao cliente';
COMMENT ON COLUMN public.products.product_category IS 'Categoria do produto: Curso Online, Ebook, Mentoria, Evento, Serviço, Software, Outro';