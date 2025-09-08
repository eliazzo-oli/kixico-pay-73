-- Create plans table to store available subscription plans
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KZS',
  max_products INTEGER NOT NULL,
  withdrawal_time TEXT NOT NULL,
  transaction_fee NUMERIC NOT NULL,
  features TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert the three plans defined by the user
INSERT INTO public.plans (name, price, max_products, withdrawal_time, transaction_fee, features) VALUES 
(
  'Básico',
  4900,
  2,
  '3-5 dias úteis',
  2.5,
  ARRAY['Cadastro de até 2 produtos', 'Saques em 3-5 dias úteis', 'Taxa competitiva de transação', 'Suporte por email']
),
(
  'Profissional', 
  14900,
  10,
  '24-48 horas',
  2.0,
  ARRAY['Cadastro de até 10 produtos', 'Saques em 24-48 horas', 'Dashboard avançado', 'Checkout personalizável', 'Taxa reduzida de transação', 'Suporte prioritário']
),
(
  'Empresarial',
  49900,
  -1,
  'Instantâneo',
  1.5,
  ARRAY['Produtos ilimitados', 'Transações ilimitadas', 'Saques instantâneos', 'Dashboard completo', 'Checkout totalmente personalizável', 'Taxa mínima de transação', 'Suporte prioritário 24/7', 'API dedicada']
);

-- Create user_subscriptions table to track user plan subscriptions
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on plans table
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Create policy for plans - anyone can view active plans
CREATE POLICY "Anyone can view active plans" 
ON public.plans 
FOR SELECT 
USING (is_active = true);

-- Enable RLS on user_subscriptions table
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.user_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions" 
ON public.user_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" 
ON public.user_subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to get user's current active subscription
CREATE OR REPLACE FUNCTION get_user_current_plan(user_uuid UUID)
RETURNS TABLE(
  plan_name TEXT,
  max_products INTEGER,
  withdrawal_time TEXT,
  transaction_fee NUMERIC,
  features TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.name,
    p.max_products,
    p.withdrawal_time,
    p.transaction_fee,
    p.features
  FROM public.user_subscriptions us
  JOIN public.plans p ON us.plan_id = p.id
  WHERE us.user_id = user_uuid 
    AND us.status = 'active'
    AND (us.expires_at IS NULL OR us.expires_at > now())
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Give all existing users a basic plan by default
INSERT INTO public.user_subscriptions (user_id, plan_id)
SELECT 
  p.user_id,
  (SELECT id FROM public.plans WHERE name = 'Básico' LIMIT 1)
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_subscriptions us WHERE us.user_id = p.user_id
);