-- Fix profiles status constraint to allow 'online' status
-- The current constraint only allows 'active' and 'suspended' but the app tries to set 'online'

-- First, check what constraint exists and drop it if needed
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

-- Create a new constraint that allows the proper status values
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check 
CHECK (status IN ('active', 'suspended', 'online', 'offline'));

-- Also fix the remaining function search path issues
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.get_user_role(uuid) SET search_path = public;
ALTER FUNCTION public.get_user_current_plan(uuid) SET search_path = public;