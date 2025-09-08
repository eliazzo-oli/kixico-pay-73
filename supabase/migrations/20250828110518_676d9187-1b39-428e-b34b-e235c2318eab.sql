-- Function to create sale notifications
CREATE OR REPLACE FUNCTION public.create_sale_notification()
RETURNS TRIGGER AS $$
DECLARE
  product_name text;
  formatted_amount text;
BEGIN
  -- Check if status changed to completed or paid
  IF (OLD.status != NEW.status) AND (NEW.status IN ('completed', 'paid')) THEN
    -- Get product name
    SELECT name INTO product_name
    FROM public.products
    WHERE id = NEW.product_id;
    
    -- Format amount with currency
    formatted_amount := NEW.amount || ' KZS';
    
    -- Insert notification
    INSERT INTO public.notifications (
      user_id,
      message,
      sender,
      read,
      created_at,
      updated_at
    ) VALUES (
      NEW.user_id,
      'Parabéns! Você fez uma nova venda de ' || COALESCE(product_name, 'Produto') || ' no valor de ' || formatted_amount || '.',
      'Plataforma',
      false,
      now(),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for sale notifications
CREATE TRIGGER trigger_sale_notification
  AFTER UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.create_sale_notification();