-- Política para permitir visualização pública de produtos ativos no checkout
CREATE POLICY "Anyone can view active products for checkout"
ON public.products
FOR SELECT
USING (active = true);