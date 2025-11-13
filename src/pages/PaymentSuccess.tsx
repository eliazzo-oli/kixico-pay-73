import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ExternalLink, Mail, MessageCircle, ArrowLeft } from 'lucide-react';

interface LocationState {
  productName: string;
  productCategory?: string;
  productDeliveryLink?: string;
  sellerSupportContact?: string;
  customerEmail: string;
  customerName: string;
  amount: number;
}

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<LocationState | null>(null);

  useEffect(() => {
    const state = location.state as LocationState;
    if (!state) {
      // If no state, redirect to home
      navigate('/');
      return;
    }
    setData(state);
  }, [location, navigate]);

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Carregando...</div>
      </div>
    );
  }

  const getSupportIcon = () => {
    if (data.sellerSupportContact?.includes('@')) {
      return <Mail className="h-4 w-4" />;
    } else if (data.sellerSupportContact?.includes('+')) {
      return <MessageCircle className="h-4 w-4" />;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Card */}
          <Card className="border-success/20 shadow-elegant mb-6">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <CardTitle className="text-3xl font-bold text-success mb-2">
                Pagamento Aprovado com Sucesso!
              </CardTitle>
              <p className="text-muted-foreground">
                Obrigado pela sua compra, {data.customerName}
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Purchase Details */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Produto</p>
                    <p className="font-semibold text-foreground">{data.productName}</p>
                    {data.productCategory && (
                      <Badge variant="outline" className="mt-1">
                        {data.productCategory}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="font-bold text-lg text-foreground">
                      {data.amount.toLocaleString('pt-AO')} AOA
                    </p>
                  </div>
                </div>
              </div>

              {/* Access Product Button */}
              {data.productDeliveryLink && (
                <div className="space-y-3">
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-foreground mb-2">
                      Aceda ao seu produto agora
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Clique no botão abaixo para aceder ao conteúdo que acabou de adquirir
                    </p>
                  </div>
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-success hover:bg-success/90 text-white"
                  >
                    <a
                      href={data.productDeliveryLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-5 w-5" />
                      Aceder ao seu Produto Agora
                    </a>
                  </Button>
                </div>
              )}

              {/* Support Contact */}
              {data.sellerSupportContact && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-foreground mb-2">
                    Precisa de ajuda?
                  </h3>
                  <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="mt-1">{getSupportIcon()}</div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">
                        Se tiver algum problema ou dúvida, contacte o suporte do vendedor:
                      </p>
                      <p className="font-medium text-foreground break-all">
                        {data.sellerSupportContact}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Confirmation */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      E-mail de confirmação enviado
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Enviámos todos os detalhes da compra para {data.customerEmail}
                    </p>
                  </div>
                </div>
              </div>

              {/* Back Button */}
              <div className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar à Página Inicial
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer Note */}
          <p className="text-center text-sm text-muted-foreground">
            Obrigado por usar a KixicoPay para processar o seu pagamento de forma segura
          </p>
        </div>
      </div>
    </div>
  );
}
