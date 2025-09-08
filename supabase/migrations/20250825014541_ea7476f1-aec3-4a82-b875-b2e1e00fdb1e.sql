-- Add plano_assinatura column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN plano_assinatura text NOT NULL DEFAULT 'basico';