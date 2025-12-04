-- Create exchange_rates table for managing currency conversion rates
CREATE TABLE public.exchange_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_currency, to_currency)
);

-- Enable RLS
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Anyone can read exchange rates
CREATE POLICY "Anyone can view exchange rates"
ON public.exchange_rates FOR SELECT
USING (true);

-- Only admins can manage exchange rates
CREATE POLICY "Admins can manage exchange rates"
ON public.exchange_rates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create currency_conversions table for tracking conversion history
CREATE TABLE public.currency_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  from_amount NUMERIC NOT NULL,
  to_amount NUMERIC NOT NULL,
  exchange_rate NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.currency_conversions ENABLE ROW LEVEL SECURITY;

-- Users can view their own conversions
CREATE POLICY "Users can view their own conversions"
ON public.currency_conversions FOR SELECT
USING (auth.uid() = user_id);

-- System can create conversions (via edge function with service role)
CREATE POLICY "System can create conversions"
ON public.currency_conversions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert initial BRL to AOA exchange rate
INSERT INTO public.exchange_rates (from_currency, to_currency, rate)
VALUES ('BRL', 'AOA', 150);

-- Create index for faster lookups
CREATE INDEX idx_exchange_rates_currencies ON public.exchange_rates(from_currency, to_currency);
CREATE INDEX idx_currency_conversions_user ON public.currency_conversions(user_id);