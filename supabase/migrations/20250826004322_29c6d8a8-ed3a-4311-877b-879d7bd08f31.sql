-- Criar tabela para rastrear notificações globais lidas por usuário
CREATE TABLE IF NOT EXISTS public.notification_read_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, notification_id)
);

-- Habilitar RLS
ALTER TABLE public.notification_read_status ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can manage their own read status" 
ON public.notification_read_status 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);