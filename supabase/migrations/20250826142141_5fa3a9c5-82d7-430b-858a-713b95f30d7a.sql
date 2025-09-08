-- Atualizar plano Básico
UPDATE public.plans 
SET 
  withdrawal_time = 'até 24 horas',
  transaction_fee = 10.0,
  features = ARRAY[
    'Cadastro de até 2 produtos',
    'Saques processados em até 24 horas', 
    'Taxa de transação de 10%',
    'Suporte por email'
  ],
  updated_at = now()
WHERE name = 'Básico';

-- Atualizar plano Profissional  
UPDATE public.plans
SET 
  withdrawal_time = 'até 12 horas',
  transaction_fee = 5.0,
  features = ARRAY[
    'Cadastro de até 5 produtos',
    'Saques processados em até 12 horas',
    'Taxa de transação de 5%', 
    'Dashboard avançado',
    'Checkout personalizável',
    'Suporte prioritário'
  ],
  updated_at = now()
WHERE name = 'Profissional';

-- Atualizar plano Empresarial
UPDATE public.plans
SET 
  withdrawal_time = 'Instantâneo',
  transaction_fee = 0.0,
  features = ARRAY[
    'Produtos ilimitados',
    'Transações ilimitadas', 
    'Saques instantâneos',
    'Taxa de transação 0% (sem taxa)',
    'Dashboard completo',
    'Checkout totalmente personalizável',
    'Suporte prioritário 24/7',
    'API dedicada'
  ],
  updated_at = now()
WHERE name = 'Empresarial';