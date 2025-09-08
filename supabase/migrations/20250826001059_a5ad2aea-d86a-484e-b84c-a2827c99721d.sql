-- Adicionar trigger para definir data de expiração automática nas assinaturas
CREATE OR REPLACE FUNCTION set_subscription_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Se não foi definida uma data de expiração, definir para 30 dias a partir de agora
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at = NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para definir expiração automática
CREATE TRIGGER set_subscription_expiry_trigger
  BEFORE INSERT ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION set_subscription_expiry();

-- Atualizar assinaturas existentes sem data de expiração
UPDATE user_subscriptions 
SET expires_at = started_at + INTERVAL '30 days'
WHERE expires_at IS NULL;