-- Add KYC fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'nao_verificado' CHECK (kyc_status IN ('nao_verificado', 'pendente', 'verificado', 'rejeitado')),
ADD COLUMN IF NOT EXISTS id_front_url TEXT,
ADD COLUMN IF NOT EXISTS id_back_url TEXT,
ADD COLUMN IF NOT EXISTS selfie_url TEXT,
ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS kyc_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT;

-- Create KYC documents storage bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents', 
  'kyc-documents', 
  false, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'application/pdf']::text[]
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for KYC documents bucket
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own KYC documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'kyc-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all KYC documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'kyc-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status ON public.profiles(kyc_status);
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_submitted_at ON public.profiles(kyc_submitted_at);