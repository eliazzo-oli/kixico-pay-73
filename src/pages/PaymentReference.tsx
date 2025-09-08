import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Receipt, CheckCircle, Copy, ArrowLeft, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatPriceFromDB } from '@/lib/utils';

interface PaymentReferenceState {
  product: {
    name: string;
    price: number;
  };
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  transactionId: string;
  planData?: {
    planName?: string;
    isUpgrade?: boolean;
  };
}

export default function PaymentReference() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const state = location.state as PaymentReferenceState;

  if (!state) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Sessão expirada
            </h2>
            <p className="text-muted-foreground mb-4">
              Não foi possível encontrar os dados do pagamento.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <img 
                src="/lovable-uploads/22ff7c61-cfa1-40d4-a028-a25cba4d4616.png" 
                alt="KixicoPay Logo" 
                className="mx-auto h-[180px] w-auto object-contain"
              />
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <h1 className="text-3xl font-bold text-foreground">
                Pagamento Iniciado
              </h1>
            </div>
            
            <p className="text-muted-foreground">
              Seu pedido foi registrado! Complete o pagamento usando os dados abaixo.
            </p>
          </div>

          {/* Order Summary */}
          <Card className="mb-6 border-border/50 shadow-elegant">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Resumo do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-foreground">Produto:</span>
                <span className="font-medium text-foreground">{state.product.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground">Cliente:</span>
                <span className="font-medium text-foreground">{state.customer.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground">Email:</span>
                <span className="font-medium text-foreground">{state.customer.email}</span>
              </div>
              {state.customer.phone && (
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Telefone:</span>
                  <span className="font-medium text-foreground">{state.customer.phone}</span>
                </div>
              )}
              <div className="border-t border-border/50 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-foreground">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {state.planData ? 
                      `${formatPriceFromDB(state.product.price)}/mês` :
                      formatPriceFromDB(state.product.price)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Payment Status */}
          <Card className="mb-6 border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="bg-green-500 rounded-full p-2 flex-shrink-0">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Status do Pagamento</h4>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    Confirmação Automática
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    O pagamento será confirmado automaticamente assim que for processado pelo banco.
                    Não é necessário enviar comprovativo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="mb-8 border-yellow-500/20 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="text-yellow-600 text-lg">Instruções Importantes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="bg-yellow-500 rounded-full w-2 h-2 mt-2 flex-shrink-0" />
                  <span>O pagamento será confirmado automaticamente assim que for processado pelo banco</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="bg-yellow-500 rounded-full w-2 h-2 mt-2 flex-shrink-0" />
                  <span>Pode pagar em qualquer banco ou caixa automático em Angola</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="bg-yellow-500 rounded-full w-2 h-2 mt-2 flex-shrink-0" />
                  <span>Guarde o comprovativo de pagamento para seus registros</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="bg-yellow-500 rounded-full w-2 h-2 mt-2 flex-shrink-0" />
                  <span>Em caso de dúvidas, contacte o nosso suporte</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex-1 h-12"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Button>
            
            {state.planData?.isUpgrade && (
              <Button
                onClick={() => navigate('/dashboard')}
                variant="premium"
                className="flex-1 h-12 shadow-glow"
              >
                Ir para o Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}