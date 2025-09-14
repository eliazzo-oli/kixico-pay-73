-- Add preferred_theme column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN preferred_theme TEXT DEFAULT 'light' CHECK (preferred_theme IN ('light', 'dark'));