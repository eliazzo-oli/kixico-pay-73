-- Update default sender from 'Administrador' to 'Suporte'
ALTER TABLE public.notifications ALTER COLUMN sender SET DEFAULT 'Suporte';