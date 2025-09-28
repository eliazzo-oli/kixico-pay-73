-- Security hardening for transactions and profiles tables
-- Add explicit denial policies and strengthen existing ones

-- 1. Add explicit denial policy for public access to transactions
DROP POLICY IF EXISTS "Deny public access to transactions" ON public.transactions;
CREATE POLICY "Deny public access to transactions" 
ON public.transactions 
FOR ALL 
TO anon, public 
USING (false);

-- 2. Strengthen transactions policies to be more explicit about authentication requirement
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Authenticated users can view their own transactions" 
ON public.transactions 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
CREATE POLICY "Authenticated users can update their own transactions" 
ON public.transactions 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can create transactions for their products" ON public.transactions;
CREATE POLICY "Authenticated users can create transactions for their products" 
ON public.transactions 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = transactions.product_id 
    AND products.user_id = auth.uid()
  )
);

-- 3. Add explicit denial policy for public access to profiles
DROP POLICY IF EXISTS "Deny public access to profiles" ON public.profiles;
CREATE POLICY "Deny public access to profiles" 
ON public.profiles 
FOR ALL 
TO anon, public 
USING (false);

-- 4. Strengthen profiles policies to be more explicit about authentication requirement
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Authenticated users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Authenticated users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
CREATE POLICY "Authenticated users can create their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 5. Fix function search path security issues
ALTER FUNCTION public.trigger_webhook_on_transaction_change() SET search_path = public;
ALTER FUNCTION public.create_sale_notification() SET search_path = public;
ALTER FUNCTION public.set_subscription_expiry() SET search_path = public;
ALTER FUNCTION public.create_webhook_event(uuid, text, jsonb) SET search_path = public;
ALTER FUNCTION public.generate_webhook_secret() SET search_path = public;