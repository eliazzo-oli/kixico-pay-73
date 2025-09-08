-- Insert a test transaction to demonstrate the sale notification popup
-- First, let's get a user_id and product_id from existing data
DO $$
DECLARE
    test_user_id uuid;
    test_product_id uuid;
BEGIN
    -- Get the first available user
    SELECT user_id INTO test_user_id FROM profiles LIMIT 1;
    
    -- Get the first available product
    SELECT id INTO test_product_id FROM products LIMIT 1;
    
    -- Only insert if we have both user and product
    IF test_user_id IS NOT NULL AND test_product_id IS NOT NULL THEN
        INSERT INTO transactions (
            user_id,
            product_id,
            amount,
            customer_email,
            customer_name,
            status,
            payment_method
        ) VALUES (
            test_user_id,
            test_product_id,
            25000.00,
            'cliente@teste.com',
            'Cliente Teste',
            'completed',
            'transferencia'
        );
    END IF;
END $$;