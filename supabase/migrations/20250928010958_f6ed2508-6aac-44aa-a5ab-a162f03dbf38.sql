-- Add 2FA columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN two_factor_secret TEXT,
ADD COLUMN is_two_factor_enabled BOOLEAN DEFAULT false NOT NULL;

-- Create recovery codes table
CREATE TABLE public.recovery_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hashed_code TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on recovery_codes table
ALTER TABLE public.recovery_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for recovery_codes
CREATE POLICY "Users can view their own recovery codes" 
ON public.recovery_codes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recovery codes" 
ON public.recovery_codes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can create recovery codes" 
ON public.recovery_codes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_recovery_codes_updated_at
BEFORE UPDATE ON public.recovery_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();