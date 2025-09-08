-- First, clear all test data from products and transactions tables
DELETE FROM transactions;
DELETE FROM products;

-- Verify the handle_new_user function exists and works correctly
-- Update the handle_new_user function to ensure proper profile creation with zero balance
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, balance)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email), 
    NEW.email,
    0.00
  );
  RETURN NEW;
END;
$$;