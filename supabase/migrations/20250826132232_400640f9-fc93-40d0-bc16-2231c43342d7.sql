-- Atualizar o plano Profissional de 10 produtos para 5 produtos
UPDATE plans 
SET max_products = 5, 
    features = ARRAY[
      'Cadastro de até 5 produtos',
      'Saques em 24-48 horas',
      'Dashboard avançado',
      'Checkout personalizável',
      'Taxa reduzida de transação',
      'Suporte prioritário'
    ]
WHERE name = 'Profissional';