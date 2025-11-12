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
import { CheckoutTimer } from '@/components/CheckoutTimer';
import { usePixelTracking } from '@/hooks/usePixelTracking';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  user_id: string;
  checkout_background_color?: string | null;
  checkout_text_color?: string | null;
  checkout_button_color?: string | null;
  checkout_timer_enabled?: boolean | null;
  checkout_show_kixicopay_logo?: boolean | null;
  accepted_payment_methods?: string[] | null;
  pixel_id?: string | null;
  order_bump_enabled?: boolean | null;
  order_bump_product_id?: string | null;
  order_bump_price?: number | null;
  order_bump_headline?: string | null;
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
  
  // Order Bump states
  const [orderBumpAccepted, setOrderBumpAccepted] = useState(false);
  const [orderBumpProduct, setOrderBumpProduct] = useState<{ name: string; description: string; image_url?: string } | null>(null);
  
  // Coupon states
  const [showCouponField, setShowCouponField] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
  } | null>(null);
  const [isCouponLoading, setIsCouponLoading] = useState(false);

  // Initialize pixel tracking
  const { trackPurchase } = usePixelTracking({
    pixelId: product?.pixel_id,
    enabled: !!product?.pixel_id,
  });

  useEffect(() => {
    fetchProduct();
  }, [productId, queryProductId]);

  useEffect(() => {
    if (product?.order_bump_enabled && product?.order_bump_product_id) {
      fetchOrderBumpProduct();
    }
  }, [product?.order_bump_product_id]);

  const fetchOrderBumpProduct = async () => {
    if (!product?.order_bump_product_id) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('name, description, image_url')
        .eq('id', product.order_bump_product_id)
        .single();

      if (error) throw error;
      setOrderBumpProduct(data);
    } catch (error) {
      console.error('Error fetching order bump product:', error);
    }
  };

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
        .select('id, name, description, price, image_url, user_id, active, checkout_background_color, checkout_text_color, checkout_button_color, checkout_timer_enabled, checkout_show_kixicopay_logo, accepted_payment_methods, pixel_id, order_bump_enabled, order_bump_product_id, order_bump_price, order_bump_headline')
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

  const calculateDiscountedPrice = (originalPrice: number) => {
    if (!appliedCoupon) return originalPrice;
    
    if (appliedCoupon.discount_type === 'percentage') {
      return originalPrice * (1 - appliedCoupon.discount_value / 100);
    } else {
      return Math.max(0, originalPrice - appliedCoupon.discount_value);
    }
  };

  const calculateTotalPrice = () => {
    let total = calculateDiscountedPrice(product?.price || 0);
    if (orderBumpAccepted && product?.order_bump_price) {
      total += product.order_bump_price;
    }
    return total;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !product) return;
    
    setIsCouponLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: {
          product_id: product.id,
          coupon_code: couponCode.trim()
        }
      });

      if (error) throw error;

      if (data.valid) {
        setAppliedCoupon({
          code: couponCode.trim().toUpperCase(),
          discount_type: data.discount_type,
          discount_value: data.discount_value
        });
        toast({
          title: 'Cupão aplicado!',
          description: `Desconto de ${data.discount_type === 'percentage' ? `${data.discount_value}%` : `${formatPriceFromDB(data.discount_value)}`} aplicado.`,
        });
        setCouponCode('');
        setShowCouponField(false);
      } else {
        toast({
          title: 'Cupão inválido',
          description: data.error || 'O cupão inserido não é válido.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao aplicar cupão. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast({
      title: 'Cupão removido',
      description: 'O desconto foi removido do pedido.',
    });
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
          amount: calculateTotalPrice(),
          status: selectedPaymentMethod === 'reference' ? 'pending' : 'pending',
          payment_method: selectedPaymentMethod,
          payment_link: `${window.location.origin}/checkout/${product.id}`,
        })
        .select()
        .single();

      if (error) throw error;

      // If order bump was accepted, create a separate transaction for it
      if (orderBumpAccepted && product.order_bump_product_id && product.order_bump_price) {
        const { error: orderBumpError } = await supabase
          .from('transactions')
          .insert({
            product_id: product.order_bump_product_id,
            user_id: product.user_id,
            customer_email: customerData.email,
            customer_name: customerData.name,
            amount: product.order_bump_price,
            status: selectedPaymentMethod === 'reference' ? 'pending' : 'pending',
            payment_method: selectedPaymentMethod,
            payment_link: `${window.location.origin}/checkout/${product.id}`,
          });

        if (orderBumpError) {
          console.error('Error creating order bump transaction:', orderBumpError);
        }
      }

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

      // Track purchase with pixel
      trackPurchase({
        value: calculateTotalPrice(),
        currency: 'AOA',
      });

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

  const allPaymentMethods = [
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

  // Filter payment methods based on product configuration
  const paymentMethods = product?.accepted_payment_methods && product.accepted_payment_methods.length > 0
    ? allPaymentMethods.filter(method => product.accepted_payment_methods!.includes(method.id))
    : allPaymentMethods;

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

  // Get customization settings from product
  const backgroundColor = product?.checkout_background_color || '#ffffff';
  const textColor = product?.checkout_text_color || '#000000';
  const buttonColor = product?.checkout_button_color || '#6366f1';
  const timerEnabled = product?.checkout_timer_enabled || false;
  const showKixicoPayLogo = product?.checkout_show_kixicopay_logo !== false;

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor }}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            {/* Logo KixicoPay */}
            {showKixicoPayLogo && (
              <div className="mb-6">
                <img 
                  src="/lovable-uploads/22ff7c61-cfa1-40d4-a028-a25cba4d4616.png" 
                  alt="KixicoPay Logo" 
                  className="mx-auto h-[240px] w-auto object-contain logo-animated optimized-image"
                  loading="eager"
                  decoding="async"
                />
              </div>
            )}
            
            <h1 className="text-3xl font-bold" style={{ color: textColor }}>
              Finalizar Compra
            </h1>
            <p style={{ color: textColor, opacity: 0.7 }}>
              Conclua sua compra de forma segura
            </p>
          </div>
          
          {/* Timer de Escassez */}
          {timerEnabled && (
            <div className="mb-6">
              <CheckoutTimer textColor={textColor} buttonColor={buttonColor} />
            </div>
          )}

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
                  {/* Applied Coupon Display */}
                  {appliedCoupon && (
                    <div className="pt-4 border-t border-border/50">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Preço original:</span>
                        <span className="text-muted-foreground line-through">
                          {formatPriceFromDB(product.price)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-green-600">
                          Desconto ({appliedCoupon.code}):
                        </span>
                        <span className="text-green-600">
                          -{appliedCoupon.discount_type === 'percentage' 
                            ? `${appliedCoupon.discount_value}%` 
                            : formatPriceFromDB(appliedCoupon.discount_value)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-4 border-t border-border/50">
                    <span className="text-lg font-medium text-foreground">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      {planData ? 
                        `${formatPriceFromDB(calculateTotalPrice())}/mês` :
                        formatPriceFromDB(calculateTotalPrice())}
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
                  
                  <div className="grid grid-cols-1 gap-4">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className="border-2 rounded-xl p-6 cursor-pointer transition-all duration-300"
                        style={{
                          borderColor: selectedPaymentMethod === method.id ? buttonColor : 'hsl(var(--border))',
                          backgroundColor: selectedPaymentMethod === method.id ? `${buttonColor}15` : 'transparent',
                        }}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <img 
                              src={method.logo} 
                              alt={method.name}
                              className="h-16 w-auto object-contain"
                            />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-foreground text-lg">
                              {method.name}
                            </h5>
                            <p className="text-muted-foreground text-sm mt-1">
                              {method.description}
                            </p>
                          </div>
                          {selectedPaymentMethod === method.id && (
                            <div className="flex-shrink-0">
                              <div 
                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: buttonColor }}
                              >
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                </div>

                {/* Coupon Section */}
                <div className="space-y-4">
                  {!appliedCoupon ? (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setShowCouponField(!showCouponField)}
                        className="text-primary hover:text-primary/80 text-sm flex items-center gap-1 transition-colors"
                      >
                        ▶ Tem um cupão de desconto?
                      </button>
                      
                      {showCouponField && (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Digite o código do cupão"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={!couponCode.trim() || isCouponLoading}
                            size="sm"
                            style={{ 
                              backgroundColor: buttonColor,
                              color: '#ffffff'
                            }}
                          >
                            {isCouponLoading ? 'A aplicar...' : 'Aplicar'}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 text-sm font-medium">
                          Cupão aplicado: {appliedCoupon.code}
                        </span>
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                          {appliedCoupon.discount_type === 'percentage' 
                            ? `${appliedCoupon.discount_value}%` 
                            : formatPriceFromDB(appliedCoupon.discount_value)} desconto
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCoupon}
                        className="hover:bg-red-50"
                        style={{ 
                          color: buttonColor
                        }}
                      >
                        Remover
                      </Button>
                    </div>
                  )}
                </div>

                {/* Order Bump Section */}
                {product?.order_bump_enabled && 
                 product?.order_bump_product_id && 
                 product?.order_bump_price && 
                 orderBumpProduct && (
                  <div className="space-y-4">
                    <div 
                      className="border-2 rounded-lg p-6 transition-all cursor-pointer"
                      onClick={() => setOrderBumpAccepted(!orderBumpAccepted)}
                      style={{
                        borderColor: orderBumpAccepted ? buttonColor : 'rgba(0,0,0,0.1)',
                        backgroundColor: orderBumpAccepted ? `${buttonColor}10` : 'transparent',
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={orderBumpAccepted}
                          onChange={(e) => setOrderBumpAccepted(e.target.checked)}
                          className="mt-1 h-5 w-5 rounded cursor-pointer"
                          style={{
                            accentColor: buttonColor,
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            {orderBumpProduct.image_url && (
                              <img 
                                src={orderBumpProduct.image_url} 
                                alt={orderBumpProduct.name}
                                className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                              />
                            )}
                            <div className="flex-1">
                              <h4 
                                className="font-semibold text-lg mb-2"
                                style={{ color: textColor }}
                              >
                                {product.order_bump_headline || '🎁 Oferta Especial!'}
                              </h4>
                              <p className="font-bold mb-2" style={{ color: textColor }}>
                                {orderBumpProduct.name}
                              </p>
                              <p className="text-sm mb-3 opacity-75" style={{ color: textColor }}>
                                {orderBumpProduct.description}
                              </p>
                              <div className="flex items-center gap-2">
                                <span 
                                  className="text-2xl font-bold"
                                  style={{ color: buttonColor }}
                                >
                                  {formatPriceFromDB(product.order_bump_price)}
                                </span>
                                <Badge 
                                  variant="secondary" 
                                  style={{
                                    backgroundColor: `${buttonColor}20`,
                                    color: buttonColor,
                                  }}
                                >
                                  Preço Especial
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handlePayment}
                  size="lg"
                  className="w-full h-14 text-lg font-semibold shadow-glow"
                  style={{ 
                    backgroundColor: buttonColor,
                    color: '#ffffff'
                  }}
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