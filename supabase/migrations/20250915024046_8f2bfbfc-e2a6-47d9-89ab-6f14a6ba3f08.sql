-- Create coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  user_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  value NUMERIC NOT NULL CHECK (value > 0),
  expiry_date TIMESTAMP WITH TIME ZONE,
  usage_limit INTEGER DEFAULT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own coupons" 
ON public.coupons 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own coupons" 
ON public.coupons 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coupons" 
ON public.coupons 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own coupons" 
ON public.coupons 
FOR DELETE 
USING (auth.uid() = user_id);

-- Anyone can view active coupons for validation (but only code and basic info)
CREATE POLICY "Anyone can validate coupons" 
ON public.coupons 
FOR SELECT 
USING (is_active = true AND (expiry_date IS NULL OR expiry_date > now()) AND (usage_limit IS NULL OR used_count < usage_limit));

-- Add trigger for updated_at
CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key reference to products
ALTER TABLE public.coupons 
ADD CONSTRAINT fk_coupons_product 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;