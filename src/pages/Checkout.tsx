import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatPriceFromDB } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  user_id: string;
}

export default function Checkout() {
  const { productId } = useParams<{ productId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get product ID from query parameters as well
  const urlParams = new URLSearchParams(location.search);
  const queryProductId = urlParams.get('id');
  
  // Dados do plano vindos da navegação (upgrade)
  const planData = location.state as {
    planId?: string;
    planName?: string;
    planPrice?: number;
    isUpgrade?: boolean;
  } | null;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productId, queryProductId]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      
      // Se há dados de plano vindos da navegação, usar esses dados
      if (planData) {
        setProduct({
          id: planData.planId || 'plan',
          name: planData.planName || 'Plano de Assinatura',
          description: planData.isUpgrade 
            ? `Upgrade para o plano ${planData.planName}` 
            : `Assinatura do plano ${planData.planName}`,
          price: planData.planPrice || 0,
          image_url: '',
          user_id: 'plan'
        });
        setIsLoading(false);
        return;
      }

      // Get product ID from params or query parameter
      const currentProductId = productId || queryProductId;
      
      // Se não há productId, mostrar erro
      if (!currentProductId) {
        setProduct(null);
        setIsLoading(false);
        return;
      }

      // Buscar produto na tabela products do Supabase (sem autenticação)
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price, image_url, user_id, active')
        .eq('id', currentProductId)
        .eq('active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching product:', error);
        throw error;
      }

      if (!data) {
        // Produto não encontrado
        setProduct(null);
        toast({
          title: 'Produto não encontrado',
          description: 'O produto que você está procurando não existe ou não está mais disponível.',
          variant: 'destructive',
        });
        return;
      }

      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      setProduct(null);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao carregar o produto. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      if (!product || !selectedPaymentMethod) return;

      // Validate customer data
      if (!customerData.name.trim() || !customerData.email.trim()) {
        toast({
          title: 'Erro',
          description: 'Por favor, preencha todos os campos obrigatórios',
          variant: 'destructive',
        });
        return;
      }

      // Create transaction record
      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          product_id: product.id,
          user_id: product.user_id,
          customer_email: customerData.email,
          customer_name: customerData.name,
          amount: product.price,
          status: selectedPaymentMethod === 'reference' ? 'pending' : 'pending',
          payment_method: selectedPaymentMethod,
          payment_link: `${window.location.origin}/checkout/${product.id}`,
        })
        .select()
        .single();

      if (error) throw error;

      // Se for pagamento por referência, redirecionar para página de detalhes
      if (selectedPaymentMethod === 'reference') {
        navigate('/payment-reference', {
          state: {
            product: {
              name: product.name,
              price: product.price,
            },
            customer: {
              name: customerData.name,
              email: customerData.email,
              phone: customerData.phone,
            },
            transactionId: transaction.id,
            planData: planData,
          }
        });
        return;
      }

      // Para outros métodos de pagamento, continuar com a lógica existente
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update transaction status (in a real app, this would be done by payment provider webhook)
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transaction.id);

      if (updateError) throw updateError;

      // Se for upgrade de plano, atualizar o plano do usuário e enviar notificação
      if (planData && planData.isUpgrade) {
        // Buscar usuário atual autenticado 
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Atualizar plano do usuário
          const planType = planData.planName?.toLowerCase() || 'basico';
          const { error: planUpdateError } = await supabase
            .from('profiles')
            .update({ 
              plano_assinatura: planType,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);

          if (planUpdateError) {
            console.error('Error updating user plan:', planUpdateError);
          }

          // Criar notificação de upgrade
          const planNames = {
            'basico': 'Básico',
            'profissional': 'Profissional', 
            'empresarial': 'Empresarial'
          };

          const planDisplayName = planNames[planType as keyof typeof planNames] || planData.planName;
          
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              message: `Parabéns! Você fez upgrade para o plano ${planDisplayName}. Aproveite todas as novas funcionalidades!`,
              sender: 'Sistema',
              read: false
            });

          if (notificationError) {
            console.error('Error creating notification:', notificationError);
          }
        }
      }

      toast({
        title: 'Pagamento realizado!',
        description: planData?.isUpgrade 
          ? 'Seu upgrade foi processado com sucesso!' 
          : 'Seu pagamento foi processado com sucesso.',
      });

      // Reset form
      setCustomerData({ name: '', email: '', phone: '' });
      setSelectedPaymentMethod('');

      // Redirecionar para dashboard após upgrade
      if (planData?.isUpgrade) {
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }

    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Erro no pagamento',
        description: 'Não foi possível processar o pagamento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    {
      id: 'reference',
      name: 'Pagamento por Referência',
      logo: '/assets/express.png',
      description: 'Pague com referência bancária',
    },
    {
      id: 'multicaixa',
      name: 'Multicaixa Express',
      logo: '/assets/multicaixa.png',
      description: 'Pagamento via Multicaixa',
    },
    {
      id: 'paypal_ao',
      name: 'PayPay Afri',
      logo: '/assets/paypay_afri.png',
      description: 'PayPay África',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Carregando produto...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Produto não encontrado
            </h2>
            <p className="text-muted-foreground">
              O produto que você está procurando não existe ou não está mais disponível.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            {/* Logo KixicoPay */}
            <div className="mb-6">
              <img 
                src="/lovable-uploads/22ff7c61-cfa1-40d4-a028-a25cba4d4616.png" 
                alt="KixicoPay Logo" 
                className="mx-auto h-[240px] w-auto object-contain logo-animated optimized-image"
                loading="eager"
                decoding="async"
              />
            </div>
            
            <h1 className="text-3xl font-bold text-primary">
              Finalizar Compra
            </h1>
            <p className="text-muted-foreground">
              Conclua sua compra de forma segura
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Details */}
            <Card className="border-border/50 shadow-elegant">
              <CardHeader>
                <CardTitle className="text-foreground">Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="max-w-full h-auto object-contain rounded-lg"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {product.name}
                    </h3>
                    <p className="text-muted-foreground mt-2">
                      {product.description}
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-border/50">
                    <span className="text-lg font-medium text-foreground">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      {planData ? 
                        `${formatPriceFromDB(product.price)}/mês` :
                        formatPriceFromDB(product.price)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card className="border-border/50 shadow-elegant">
              <CardHeader>
                <CardTitle className="text-foreground">Dados de Pagamento</CardTitle>
                <CardDescription>
                  Preencha seus dados para concluir a compra
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Informações do Cliente</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={customerData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={customerData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={customerData.phone}
                      onChange={handleInputChange}
                      placeholder="+244 xxx xxx xxx"
                    />
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Método de Pagamento</h4>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 text-center ${
                          selectedPaymentMethod === method.id
                            ? 'border-primary bg-primary/10 shadow-md'
                            : 'border-border/50 hover:border-primary/50 hover:shadow-sm'
                        }`}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <img 
                            src={method.logo} 
                            alt={method.name}
                            className="h-12 w-auto object-contain"
                          />
                          <h5 className="font-medium text-foreground text-sm">
                            {method.name}
                          </h5>
                          {selectedPaymentMethod === method.id && (
                            <Badge variant="default" className="mt-1">Selecionado</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                </div>

                <Button
                  onClick={handlePayment}
                  variant="premium"
                  size="lg"
                  className="w-full h-14 text-lg font-semibold shadow-glow"
                  disabled={!selectedPaymentMethod || isProcessing}
                >
                  {isProcessing ? 'Processando...' : 'Pagar Agora'}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Ao finalizar a compra, você concorda com nossos termos de serviço.
                  Seus dados estão protegidos e seguros.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}