import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import kixicoPayLogo from "/lovable-uploads/aaa7ebd4-937a-41c9-ab8e-25102e62b1ed.png";

interface TransactionDetail {
  id: string;
  amount: number;
  status: string;
  customer_name: string;
  customer_email: string;
  payment_method?: string;
  created_at: string;
  type: 'sale' | 'withdrawal';
  product_name?: string;
  user_name?: string;
}

export default function Invoice() {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransaction() {
      if (!transactionId) return;

      try {
        // Try to fetch from transactions table first
        const { data: salesData, error: salesError } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', transactionId)
          .maybeSingle();

        if (salesData && !salesError) {
          // Fetch related product data
          const { data: productData } = await supabase
            .from('products')
            .select('name')
            .eq('id', salesData.product_id)
            .maybeSingle();

          // Fetch seller profile
          const { data: sellerProfile } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', salesData.user_id)
            .maybeSingle();

          setTransaction({
            id: salesData.id,
            amount: Number(salesData.amount),
            status: salesData.status,
            customer_name: salesData.customer_name || 'Cliente não identificado',
            customer_email: salesData.customer_email || 'E-mail não fornecido',
            payment_method: salesData.payment_method || 'Método não especificado',
            created_at: salesData.created_at,
            type: 'sale',
            product_name: productData?.name || 'Produto não encontrado',
            user_name: sellerProfile?.name || 'Vendedor não identificado'
          });
        } else {
          // Try withdrawals table
          const { data: withdrawalData, error: withdrawalError } = await supabase
            .from('withdrawals')
            .select('*')
            .eq('id', transactionId)
            .maybeSingle();

          if (withdrawalData && !withdrawalError) {
            // Fetch user profile for withdrawal
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('user_id', withdrawalData.user_id)
              .maybeSingle();

            setTransaction({
              id: withdrawalData.id,
              amount: Number(withdrawalData.amount),
              status: withdrawalData.status,
              customer_name: userProfile?.name || 'Dados não disponíveis',
              customer_email: userProfile?.email || 'E-mail não disponível',
              payment_method: 'Saque',
              created_at: withdrawalData.created_at,
              type: 'withdrawal',
              user_name: userProfile?.name || 'Usuário não identificado'
            });
          } else {
            throw new Error('Transação não encontrada');
          }
        }
      } catch (error) {
        console.error('Error fetching transaction:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes da transação.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchTransaction();

    // Set up realtime subscription for transaction updates
    const channel = supabase
      .channel('transaction-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `id=eq.${transactionId}`
        },
        (payload) => {
          console.log('Transaction updated:', payload.new);
          // Refetch transaction data when it's updated
          fetchTransaction();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [transactionId, toast]);

  const handlePrint = () => {
    window.print();
  };

  const calculateServiceFee = (amount: number) => {
    // Assuming 2% service fee
    return amount * 0.02;
  };

  const calculateNetAmount = (amount: number) => {
    return amount - calculateServiceFee(amount);
  };

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-AO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' AOA';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Carregando fatura...</div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-muted-foreground">Transação não encontrada.</div>
        <Button onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar às Transações
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            background: white !important;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>

      {/* Header - Hidden in print */}
      <div className="no-print bg-card border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar às Transações
          </Button>
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Imprimir/Salvar PDF
          </Button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto p-6">
        <Card className="shadow-lg">
          <CardHeader className="space-y-6">
            {/* Company Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src={kixicoPayLogo} 
                  alt="KixicoPay" 
                  className="h-12 w-auto"
                />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">KixicoPay</h1>
                  <p className="text-sm text-muted-foreground">Sistema de Pagamentos</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-semibold text-primary">FATURA</h2>
                <p className="text-sm text-muted-foreground">#{transaction.id.slice(0, 8)}</p>
              </div>
            </div>

            <Separator />

            {/* Transaction Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-foreground mb-3">Detalhes da Transação</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID da Transação:</span>
                    <span className="font-mono">{transaction.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data:</span>
                    <span>{new Date(transaction.created_at).toLocaleDateString('pt-AO', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="capitalize">
                      {transaction.type === 'sale' ? 'Venda' : 'Saque'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="capitalize">{transaction.status}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-3">
                  {transaction.type === 'sale' ? 'Cliente' : 'Vendedor'}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nome:</span>
                    <span className={transaction.customer_name.includes('não') ? 'text-muted-foreground italic' : ''}>
                      {transaction.customer_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">E-mail:</span>
                    <span className={transaction.customer_email.includes('não') ? 'text-muted-foreground italic' : ''}>
                      {transaction.customer_email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Método de Pagamento:</span>
                    <span className={transaction.payment_method?.includes('não') ? 'text-muted-foreground italic' : ''}>
                      {transaction.payment_method}
                    </span>
                  </div>
                  {transaction.type === 'sale' && transaction.user_name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vendedor:</span>
                      <span className={transaction.user_name.includes('não') ? 'text-muted-foreground italic' : ''}>
                        {transaction.user_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Separator />

            {/* Product/Service Details */}
            {transaction.product_name && (
              <div>
                <h3 className="font-semibold text-foreground mb-3">Produto/Serviço</h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{transaction.product_name}</span>
                    <span className="font-medium">{formatPrice(transaction.amount)}</span>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Financial Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Resumo Financeiro</h3>
              
              <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span>Valor Bruto:</span>
                  <span className="font-medium">{formatPrice(transaction.amount)}</span>
                </div>
                
                {transaction.type === 'sale' && (
                  <>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Taxa de Serviço (2%):</span>
                      <span>-{formatPrice(calculateServiceFee(transaction.amount))}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-semibold text-primary">
                      <span>Valor Líquido:</span>
                      <span>{formatPrice(calculateNetAmount(transaction.amount))}</span>
                    </div>
                  </>
                )}
                
                {transaction.type === 'withdrawal' && (
                  <div className="flex justify-between text-lg font-semibold text-primary">
                    <span>Valor do Saque:</span>
                    <span>{formatPrice(transaction.amount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground pt-6 border-t border-border">
              <p>Esta é uma fatura gerada automaticamente pelo sistema KixicoPay.</p>
              <p>Para dúvidas, entre em contato com nosso suporte.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}