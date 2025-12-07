import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface Withdrawal {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  currency: string;
}

interface MobileWithdrawalListProps {
  withdrawals: Withdrawal[];
  formatPrice: (price: number) => string;
  formatDate: (date: string) => string;
}

export function MobileWithdrawalList({
  withdrawals,
  formatPrice,
  formatDate
}: MobileWithdrawalListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-primary" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovado';
      case 'pending':
        return 'Pendente';
      case 'rejected':
        return 'Rejeitado';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'outline';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (withdrawals.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        Nenhuma solicitação de saque encontrada.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {withdrawals.map((withdrawal) => (
        <div 
          key={withdrawal.id} 
          className="bg-card border border-border/50 rounded-xl p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-foreground">
                {formatPrice(Number(withdrawal.amount) * 100)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Solicitado em {formatDate(withdrawal.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {getStatusIcon(withdrawal.status)}
              <Badge 
                variant={getStatusVariant(withdrawal.status)}
                className="text-[10px] px-2 py-0.5"
              >
                {getStatusText(withdrawal.status)}
              </Badge>
            </div>
          </div>
          
          {withdrawal.status !== 'pending' && (
            <p className="text-[10px] text-muted-foreground mt-2">
              Atualizado: {formatDate(withdrawal.updated_at)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
