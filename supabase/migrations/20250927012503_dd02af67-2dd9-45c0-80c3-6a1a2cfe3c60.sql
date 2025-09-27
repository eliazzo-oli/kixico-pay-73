-- Update the transaction trigger to also send sale notification emails
CREATE OR REPLACE FUNCTION public.trigger_webhook_on_transaction_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  webhook_payload JSONB;
  product_info RECORD;
  user_profile RECORD;
BEGIN
  -- Only trigger webhook if status changed to completed, failed, or pending
  IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status IN ('completed', 'failed', 'pending')) OR
     (TG_OP = 'INSERT' AND NEW.status IN ('completed', 'failed', 'pending')) THEN
    
    -- Get product information
    SELECT name INTO product_info
    FROM public.products
    WHERE id = NEW.product_id;

    -- Get user profile for email notification
    SELECT name, email INTO user_profile
    FROM public.profiles
    WHERE user_id = NEW.user_id;
    
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
    
    -- Try to call webhook sender function
    BEGIN
      PERFORM
        net.http_post(
          url := 'https://tumanpeywddnixgyfale.supabase.co/functions/v1/send-webhook',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bWFucGV5d2Rkbml4Z3lmYWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTUyMDAzMywiZXhwIjoyMDcxMDk2MDMzfQ.OWm-8lHd8zTwKKQGMhgb_G9N0rH_S_Km44HevDmTB7c'
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
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        RAISE NOTICE 'Failed to send webhook: %', SQLERRM;
    END;

    -- Send sale notification email for completed transactions with positive amounts (sales)
    IF NEW.status = 'completed' AND NEW.amount > 0 AND NEW.payment_method != 'saque' AND user_profile.email IS NOT NULL THEN
      BEGIN
        PERFORM
          net.http_post(
            url := 'https://tumanpeywddnixgyfale.supabase.co/functions/v1/send-transactional-email',
            headers := jsonb_build_object(
              'Content-Type', 'application/json'
            ),
            body := jsonb_build_object(
              'to', user_profile.email,
              'template', 'sale-notification',
              'data', jsonb_build_object(
                'userName', user_profile.name,
                'productName', COALESCE(product_info.name, 'Produto'),
                'saleAmount', NEW.amount
              )
            )
          );
      EXCEPTION
        WHEN OTHERS THEN
          -- Log error but don't fail the transaction
          RAISE NOTICE 'Failed to send sale notification email: %', SQLERRM;
      END;
    END IF;
      
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;