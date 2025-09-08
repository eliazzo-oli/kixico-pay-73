-- Add trial_end_date column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ NULL;