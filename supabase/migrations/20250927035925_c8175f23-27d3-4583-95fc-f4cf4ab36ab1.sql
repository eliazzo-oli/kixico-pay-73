-- Corrigir a função handle_new_user para incluir o status explicitamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, balance, trial_end_date, status)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email), 
    NEW.email,
    0.00,
    now() + INTERVAL '30 days',
    'active'
  );
  RETURN NEW;
END;
$$;