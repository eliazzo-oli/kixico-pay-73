-- Create webhook endpoints table
CREATE TABLE public.webhook_endpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  secret_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  events TEXT[] NOT NULL DEFAULT ARRAY['pagamento.sucedido', 'pagamento.falhado', 'pagamento.pendente'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_failure_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT webhook_endpoints_url_check CHECK (url ~ '^https?://.*')
);

-- Create webhook events table
CREATE TABLE public.webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  api_version TEXT NOT NULL DEFAULT '2025-09-02',
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webhook attempts table
CREATE TABLE public.webhook_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_endpoint_id UUID NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  webhook_event_id UUID NOT NULL REFERENCES public.webhook_events(id) ON DELETE CASCADE,
  http_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  succeeded BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook_endpoints
CREATE POLICY "Users can manage their own webhook endpoints" 
ON public.webhook_endpoints 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for webhook_events
CREATE POLICY "Users can view their own webhook events" 
ON public.webhook_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create webhook events" 
ON public.webhook_events 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for webhook_attempts
CREATE POLICY "Users can view webhook attempts for their endpoints" 
ON public.webhook_attempts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.webhook_endpoints 
    WHERE id = webhook_attempts.webhook_endpoint_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "System can manage webhook attempts" 
ON public.webhook_attempts 
FOR ALL 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_webhook_endpoints_user_id ON public.webhook_endpoints(user_id);
CREATE INDEX idx_webhook_endpoints_active ON public.webhook_endpoints(is_active) WHERE is_active = true;
CREATE INDEX idx_webhook_events_user_id ON public.webhook_events(user_id);
CREATE INDEX idx_webhook_events_created_at ON public.webhook_events(created_at);
CREATE INDEX idx_webhook_attempts_endpoint_id ON public.webhook_attempts(webhook_endpoint_id);
CREATE INDEX idx_webhook_attempts_next_retry ON public.webhook_attempts(next_retry_at) WHERE next_retry_at IS NOT NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_webhook_endpoints_updated_at
BEFORE UPDATE ON public.webhook_endpoints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate webhook secret
CREATE OR REPLACE FUNCTION public.generate_webhook_secret()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN 'whsec_' || encode(gen_random_bytes(32), 'base64');
END;
$$;

-- Function to create webhook event
CREATE OR REPLACE FUNCTION public.create_webhook_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.webhook_events (user_id, event_type, data)
  VALUES (p_user_id, p_event_type, p_data)
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;