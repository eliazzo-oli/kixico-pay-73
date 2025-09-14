-- Create function to trigger webhook on transaction status change
CREATE OR REPLACE FUNCTION public.trigger_webhook_on_transaction_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  webhook_payload JSONB;
  product_info RECORD;
BEGIN
  -- Only trigger webhook if status changed to completed, failed, or pending
  IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status IN ('completed', 'failed', 'pending')) OR
     (TG_OP = 'INSERT' AND NEW.status IN ('completed', 'failed', 'pending')) THEN
    
    -- Get product information
    SELECT name INTO product_info
    FROM public.products
    WHERE id = NEW.product_id;
    
    -- Build webhook payload
    webhook_payload := jsonb_build_object(
      'object', jsonb_build_object(
        'id_pagamento', NEW.id,
        'referencia', 'KIXICOPAY-' || UPPER(substring(NEW.id::text, 1, 8)),
        'montante', NEW.amount,
        'moeda', 'AOA',
        'status', CASE 
          WHEN NEW.status = 'completed' THEN 'sucedido'
          WHEN NEW.status = 'failed' THEN 'falhado'
          ELSE 'pendente'
        END,
        'metodo_pagamento', COALESCE(NEW.payment_method, 'indefinido'),
        'produto', jsonb_build_object(
          'nome', COALESCE(product_info.name, 'Produto'),
          'preco', NEW.amount
        ),
        'cliente', jsonb_build_object(
          'email', NEW.customer_email,
          'nome', COALESCE(NEW.customer_name, 'Cliente')
        ),
        'created_at', NEW.created_at,
        'updated_at', NEW.updated_at
      )
    );
    
    -- Call webhook sender function asynchronously
    PERFORM
      net.http_post(
        url := 'https://tumanpeywddnixgyfale.supabase.co/functions/v1/send-webhook',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization'
        ),
        body := jsonb_build_object(
          'userId', NEW.user_id,
          'eventType', CASE 
            WHEN NEW.status = 'completed' THEN 'pagamento.sucedido'
            WHEN NEW.status = 'failed' THEN 'pagamento.falhado'
            ELSE 'pagamento.pendente'
          END,
          'eventData', webhook_payload
        )
      );
      
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for transaction changes
DROP TRIGGER IF EXISTS trigger_webhook_on_transaction_change ON public.transactions;
CREATE TRIGGER trigger_webhook_on_transaction_change
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_webhook_on_transaction_change();

-- Schedule webhook retry processing (runs every 5 minutes)
SELECT cron.schedule(
  'webhook-retry-processor',
  '*/5 * * * *', -- every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://tumanpeywddnixgyfale.supabase.co/functions/v1/webhook-retry',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bWFucGV5d2Rkbml4Z3lmYWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTUyMDAzMywiZXhwIjoyMDcxMDk2MDMzfQ.OWm-8lHd8zTwKKQGMhgb_G9N0rH_S_Km44HevDmTB7c"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);