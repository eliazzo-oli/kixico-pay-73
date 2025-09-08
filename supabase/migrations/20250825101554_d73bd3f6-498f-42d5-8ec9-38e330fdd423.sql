-- Allow admins to update any profile (needed for suspender/reativar conta)
CREATE POLICY IF NOT EXISTS "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));