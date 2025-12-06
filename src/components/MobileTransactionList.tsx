import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Copy } from 'lucide-react';

interface Transaction {
  id: string;
  product_id: string | null;
  amount: number;
  status: string;
  payment_method: string | null;
  customer_email: string;
  created_at: string;
  products: { name: string } | null;
}

interface MobileTransactionListProps {
  transactions: Transaction[];
  onViewInvoice: (id: string) => void;
  onCopyLink: (productId: string) => void;
}

export function MobileTransactionList({ 
  transactions, 
  onViewInvoice, 
  onCopyLink 
}: MobileTransactionListProps) {
  const getProductName = (transaction: Transaction) => {
    if (transaction.product_id) {
      return transaction.products?.name || 'Produto não encontrado';
    }
    if (transaction.payment_method === 'saque') return 'Saque Aprovado';
    if (transaction.payment_method === 'credito') return 'Ajuste (Crédito)';
    if (transaction.payment_method === 'debito') return 'Ajuste (Débito)';
    return 'Transação do Sistema';
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        Nenhuma transação encontrada
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="py-3 px-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {getProductName(transaction)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(transaction.created_at).toLocaleDateString('pt-AO')}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-foreground">
                {transaction.amount.toLocaleString('pt-AO', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })} AOA
              </p>
              <Badge
                variant={
                  transaction.status === 'completed'
                    ? 'default'
                    : transaction.status === 'pending'
                    ? 'secondary'
                    : 'destructive'
                }
                className="mt-1 text-[10px] px-1.5 py-0"
              >
                {transaction.status === 'completed'
                  ? 'Pago'
                  : transaction.status === 'pending'
                  ? 'Pendente'
                  : 'Falhou'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button 
              variant="outline" 
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={() => onViewInvoice(transaction.id)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver
            </Button>
            {transaction.product_id && (
              <Button 
                variant="outline" 
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={() => onCopyLink(transaction.product_id!)}
              >
                <Copy className="h-3 w-3 mr-1" />
                Link
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}