-- Atualizar usuários antigos no plano empresarial para garantir que tenham o plano definido corretamente
UPDATE public.profiles 
SET plano_assinatura = 'empresarial' 
WHERE plano_assinatura IS NULL 
  AND user_id IN (
    SELECT us.user_id 
    FROM public.user_subscriptions us 
    JOIN public.plans p ON us.plan_id = p.id 
    WHERE p.name = 'Empresarial' 
      AND us.status = 'active'
  );

-- Garantir que todos os usuários tenham um plano definido (padrão: básico)
UPDATE public.profiles 
SET plano_assinatura = 'basico' 
WHERE plano_assinatura IS NULL;