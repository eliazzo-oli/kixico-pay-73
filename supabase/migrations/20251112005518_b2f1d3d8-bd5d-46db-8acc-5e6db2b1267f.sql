-- Fix RLS for products UPDATE to ensure owners can update all columns
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
CREATE POLICY "Users can update their own products"
ON public.products
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Strengthen RLS for coupons INSERT to ensure user owns the product
DROP POLICY IF EXISTS "Users can create their own coupons" ON public.coupons;
CREATE POLICY "Users can create their own coupons"
ON public.coupons
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_id AND p.user_id = auth.uid()
  )
);
