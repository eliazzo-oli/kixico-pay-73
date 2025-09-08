-- Create RLS policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update existing notifications to change sender from 'Administrador' to 'Suporte'
UPDATE public.notifications 
SET sender = 'Suporte' 
WHERE sender = 'Administrador';