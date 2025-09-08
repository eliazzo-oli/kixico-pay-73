import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';
import { useTrial } from '@/hooks/useTrial';
import { useNavigate } from 'react-router-dom';

export function TrialBanner() {
  const { trialStatus } = useTrial();
  const navigate = useNavigate();

  if (!trialStatus.isExpired && !trialStatus.isInTrial) {
    return null;
  }

  if (trialStatus.isExpired) {
    return (
      <Alert className="border-destructive bg-destructive/10 mb-4">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-destructive font-medium">
            Seu período de teste expirou. Escolha um plano pago para continuar usando todas as funcionalidades.
          </span>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => navigate('/precos')}
          >
            Escolher Plano
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (trialStatus.isInTrial && trialStatus.daysRemaining <= 7) {
    return (
      <Alert className="border-warning bg-warning/10 mb-4">
        <Clock className="h-4 w-4 text-warning" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-warning font-medium">
            Restam {trialStatus.daysRemaining} dias do seu período de teste. 
            Você está usando funcionalidades do plano Profissional.
          </span>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate('/precos')}
          >
            Ver Planos
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}