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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  product_delivery_link?: string | null;
  seller_support_contact?: string | null;
  product_category?: string | null;
  currency?: string | null;
}

type Language = 'pt' | 'en';

const translations = {
  pt: {
    securePayment: 'COMPRA 100% SEGURA',
    instantDelivery: 'Entrega imediata',
    fullName: 'Nome completo',
    fullNamePlaceholder: 'Digite seu nome completo',
    email: 'E-mail',
    emailPlaceholder: 'Digite seu e-mail para receber a compra',
    phone: 'Telefone ou Whatsapp *',
    payWith: 'Pagar com:',
    selectPayment: 'Selecione a forma de pagamento desejada',
    orderSummary: 'Resumo do pedido',
    total: 'Total',
    buyNow: 'COMPRAR AGORA',
    processing: 'Processando...',
    hasCoupon: 'Tem um cupão de desconto?',
    couponPlaceholder: 'Digite o código do cupão',
    apply: 'Aplicar',
    remove: 'Remover',
    coupon: 'Cupão',
    specialOffer: '🎁 Oferta Especial!',
    soldBy: 'Vendido por:',
    processedBy: 'Processado por',
    allRights: 'Todos os direitos reservados.',
    legalText: 'Ao clicar em Comprar agora, eu declaro que li e concordo (1) com a KixicoPay está processando este pedido em nome de',
    legalText2: 'não possui responsabilidade pelo conteúdo e/ou faz controle prévio deste (li) com os',
    termsOfUse: 'Termos de uso',
    privacyPolicy: 'Política de privacidade',
    refundPolicy: 'Política de reembolso',
    and: 'e',
    productNotFound: 'Produto não encontrado',
    productNotFoundDesc: 'O produto que você está procurando não existe ou não está mais disponível.',
    loading: 'Carregando produto...',
    multicaixaExpress: 'Multicaixa Express',
    paymentByReference: 'Pagamento por Referência',
    paypayAfri: 'PayPay Afri',
  },
  en: {
    securePayment: '100% SECURE PURCHASE',
    instantDelivery: 'Instant delivery',
    fullName: 'Full name',
    fullNamePlaceholder: 'Enter your full name',
    email: 'E-mail',
    emailPlaceholder: 'Enter your e-mail to receive the purchase',
    phone: 'Phone or Whatsapp *',
    payWith: 'Pay with:',
    selectPayment: 'Select the desired payment method',
    orderSummary: 'Order summary',
    total: 'Total',
    buyNow: 'BUY NOW',
    processing: 'Processing...',
    hasCoupon: 'Have a discount coupon?',
    couponPlaceholder: 'Enter coupon code',
    apply: 'Apply',
    remove: 'Remove',
    coupon: 'Coupon',
    specialOffer: '🎁 Special Offer!',
    soldBy: 'Sold by:',
    processedBy: 'Processed by',
    allRights: 'All rights reserved.',
    legalText: 'By clicking Buy now, I declare that I have read and agree (1) that KixicoPay is processing this order on behalf of',
    legalText2: 'has no responsibility for the content and/or does not perform prior control of this (read) with the',
    termsOfUse: 'Terms of use',
    privacyPolicy: 'Privacy policy',
    refundPolicy: 'Refund policy',
    and: 'and',
    productNotFound: 'Product not found',
    productNotFoundDesc: 'The product you are looking for does not exist or is no longer available.',
    loading: 'Loading product...',
    multicaixaExpress: 'Multicaixa Express',
    paymentByReference: 'Payment by Reference',
    paypayAfri: 'PayPay Afri',
  }
};

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
  const [language, setLanguage] = useState<Language>('pt');
  
  // Order Bump states
  const [orderBumpAccepted, setOrderBumpAccepted] = useState(false);
  const [orderBumpProduct, setOrderBumpProduct] = useState<{ name: string; description: string; image_url?: string } | null>(null);
  const [sellerName, setSellerName] = useState<string>('o Vendedor');
  
  const t = translations[language];
  
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

  useEffect(() => {
    const fetchSellerName = async () => {
      if (!product?.user_id || product.user_id === 'plan') return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, fantasy_name')
          .eq('user_id', product.user_id)
          .maybeSingle();

        if (!error && data) {
          setSellerName(data.fantasy_name || data.name || 'o Vendedor');
        }
      } catch (error) {
        console.error('Error fetching seller name:', error);
      }
    };

    fetchSellerName();
  }, [product?.user_id]);

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
        .select('id, name, description, price, image_url, user_id, active, checkout_background_color, checkout_text_color, checkout_button_color, checkout_timer_enabled, checkout_show_kixicopay_logo, accepted_payment_methods, pixel_id, order_bump_enabled, order_bump_product_id, order_bump_price, order_bump_headline, product_delivery_link, seller_support_contact, product_category, currency')
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
          currency: product.currency || 'AOA',
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
            currency: product.currency || 'AOA',
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

      // Send purchase confirmation email to customer
      try {
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            to: customerData.email,
            template: 'purchase-confirmation',
            data: {
              userName: customerData.name,
              productName: product.name,
              productCategory: product.product_category,
              purchaseAmount: calculateTotalPrice(),
              deliveryLink: product.product_delivery_link,
              supportContact: product.seller_support_contact,
            }
          }
        });
      } catch (emailError) {
        console.error('Error sending purchase confirmation email:', emailError);
        // Don't fail the transaction if email fails
      }

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

      // Redirecionar para dashboard após upgrade ou para página de sucesso
      if (planData?.isUpgrade) {
        toast({
          title: 'Pagamento realizado!',
          description: 'Seu upgrade foi processado com sucesso!',
        });
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        // Redirect to success page with product info
        navigate('/payment-success', {
          state: {
            productName: product.name,
            productCategory: product.product_category,
            productDeliveryLink: product.product_delivery_link,
            sellerSupportContact: product.seller_support_contact,
            customerEmail: customerData.email,
            customerName: customerData.name,
            amount: calculateTotalPrice(),
          }
        });
      }

      // Reset form
      setCustomerData({ name: '', email: '', phone: '' });
      setSelectedPaymentMethod('');

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
      logo: '/assets/multicaixa-referencia.png',
      description: 'Pague com referência bancária',
    },
    {
      id: 'multicaixa',
      name: 'Multicaixa Express',
      logo: '/assets/multicaixa-express.png',
      description: 'Pagamento via Multicaixa',
    },
    {
      id: 'paypal_ao',
      name: 'PayPay Afri',
      logo: '/assets/paypay-afri.png',
      description: 'PayPay África',
    },
  ];

  // Filter payment methods based on product currency and configuration
  let paymentMethods = allPaymentMethods;
  
  // First, filter by currency
  const currency = product?.currency || 'AOA';
  if (currency === 'AOA') {
    // For AOA, show only Angolan payment methods
    paymentMethods = allPaymentMethods.filter(method => 
      ['reference', 'multicaixa', 'paypal_ao'].includes(method.id)
    );
  } else if (currency === 'BRL') {
    // For BRL, show only Mercado Pago (which will support PIX, Boleto, Credit Card)
    paymentMethods = allPaymentMethods.filter(method => method.id === 'mercado_pago');
  }
  
  // Then, filter by product's accepted payment methods if configured
  if (product?.accepted_payment_methods && product.accepted_payment_methods.length > 0) {
    paymentMethods = paymentMethods.filter(method => 
      product.accepted_payment_methods!.includes(method.id)
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t.loading}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t.productNotFound}
            </h2>
            <p className="text-gray-500">
              {t.productNotFoundDesc}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get customization settings from product
  const buttonColor = product?.checkout_button_color || 'hsl(var(--primary))';
  const headerBgColor = product?.checkout_button_color || 'hsl(var(--primary))';
  const timerEnabled = product?.checkout_timer_enabled || false;
  const showKixicoPayLogo = product?.checkout_show_kixicopay_logo !== false;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header - Compra 100% Segura */}
      <header 
        className="py-3 px-4"
        style={{ backgroundColor: headerBgColor }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="font-semibold text-sm">{t.securePayment}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 hover:bg-white/30 transition-colors cursor-pointer">
                <span className="text-xl">{language === 'pt' ? '🇦🇴' : '🇬🇧'}</span>
                <span className="text-white text-sm font-medium">{language === 'pt' ? 'PT' : 'EN'}</span>
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
              <DropdownMenuItem 
                onClick={() => setLanguage('pt')}
                className="flex items-center gap-2 cursor-pointer"
              >
                <span className="text-lg">🇦🇴</span>
                <span>Português</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setLanguage('en')}
                className="flex items-center gap-2 cursor-pointer"
              >
                <span className="text-lg">🇬🇧</span>
                <span>English</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="max-w-lg mx-auto space-y-6">
          
          {/* Timer de Escassez */}
          {timerEnabled && (
            <CheckoutTimer textColor="#1f2937" buttonColor={buttonColor} />
          )}

          {/* Product Card */}
          <Card className="shadow-sm border-0 bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex gap-4">
                {/* Product Image */}
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-28 h-36 object-cover rounded-xl flex-shrink-0"
                    loading="lazy"
                  />
                )}
                
                {/* Product Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h1 className="font-bold text-gray-900 text-lg leading-tight mb-1">
                      {product.name}
                    </h1>
                    {product.product_category && (
                      <p className="text-gray-500 text-xs mb-1">{product.product_category}</p>
                    )}
                    <p className="text-gray-600 text-sm mb-2">
                      {t.soldBy} <span className="font-medium text-gray-800">{sellerName}</span>
                    </p>
                    <div className="flex items-center gap-1 text-green-600 text-sm mb-3">
                      <span>{t.instantDelivery}</span>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-green-600 font-bold text-2xl">
                    {formatPriceFromDB(product.price)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 font-medium">
                {t.fullName}
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={customerData.name}
                onChange={handleInputChange}
                required
                placeholder={t.fullNamePlaceholder}
                className="h-14 rounded-xl border-gray-200 bg-white text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                {t.email}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={customerData.email}
                onChange={handleInputChange}
                required
                placeholder={t.emailPlaceholder}
                className="h-14 rounded-xl border-gray-200 bg-white text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700 font-medium">
                {t.phone}
              </Label>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 px-3 h-14 rounded-xl border border-gray-200 bg-white min-w-[110px]">
                  <span className="text-xl">🇦🇴</span>
                  <span className="text-gray-700 text-sm font-medium">+244</span>
                </div>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={customerData.phone}
                  onChange={handleInputChange}
                  placeholder="9XX XXX XXX"
                  className="flex-1 h-14 rounded-xl border-gray-200 bg-white text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <p className="text-primary font-semibold">{t.payWith}</p>
            <p className="text-gray-600 text-sm">{t.selectPayment}</p>
            
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all bg-white ${
                    selectedPaymentMethod === method.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                >
                  <img 
                    src={method.logo} 
                    alt={method.name}
                    className="h-10 w-10 object-contain mb-2"
                    loading="lazy"
                  />
                  <span className="text-[11px] text-gray-600 text-center leading-tight font-medium">
                    {method.id === 'multicaixa' ? t.multicaixaExpress : 
                     method.id === 'reference' ? t.paymentByReference : 
                     method.id === 'paypal_ao' ? t.paypayAfri : method.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Coupon Section */}
          <div className="space-y-3">
            {!appliedCoupon ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowCouponField(!showCouponField)}
                  className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  {showCouponField ? '▼' : '▶'} {t.hasCoupon}
                </button>
                
                {showCouponField && (
                  <div className="flex gap-2">
                    <Input
                      placeholder={t.couponPlaceholder}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      className="flex-1 h-12 rounded-xl border-gray-200"
                    />
                    <Button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim() || isCouponLoading}
                      className="h-12 px-6 rounded-xl"
                    >
                      {isCouponLoading ? '...' : t.apply}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-primary text-sm font-medium">
                    {t.coupon}: {appliedCoupon.code}
                  </span>
                  <Badge className="bg-primary/10 text-primary border-0">
                    {appliedCoupon.discount_type === 'percentage' 
                      ? `${appliedCoupon.discount_value}%` 
                      : formatPriceFromDB(appliedCoupon.discount_value)}
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCoupon}
                  className="text-red-500 hover:bg-red-50"
                >
                  {t.remove}
                </Button>
              </div>
            )}
          </div>

          {/* Order Bump Section */}
          {product?.order_bump_enabled && 
           product?.order_bump_product_id && 
           product?.order_bump_price && 
           orderBumpProduct && (
            <div 
              className={`border-2 rounded-2xl p-4 transition-all cursor-pointer bg-white ${
                orderBumpAccepted ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}
              onClick={() => setOrderBumpAccepted(!orderBumpAccepted)}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={orderBumpAccepted}
                  onChange={(e) => setOrderBumpAccepted(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded accent-primary"
                />
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    {orderBumpProduct.image_url && (
                      <img 
                        src={orderBumpProduct.image_url} 
                        alt={orderBumpProduct.name}
                        className="w-16 h-20 object-cover rounded-lg flex-shrink-0"
                        loading="lazy"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {product.order_bump_headline || t.specialOffer}
                      </h4>
                      <p className="font-medium text-gray-800 text-sm mb-1">
                        {orderBumpProduct.name}
                      </p>
                      <p className="text-primary font-bold">
                        {formatPriceFromDB(product.order_bump_price)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <Card className="shadow-sm border-0 bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-bold text-gray-900 text-lg">{t.orderSummary}</h3>
              
              <div className="flex justify-between items-start">
                <span className="text-gray-600 flex-1">{product.name}</span>
                <span className="font-medium text-gray-900 text-right">
                  {formatPriceFromDB(calculateDiscountedPrice(product.price))}
                </span>
              </div>
              
              {orderBumpAccepted && product.order_bump_price && orderBumpProduct && (
                <div className="flex justify-between items-start">
                  <span className="text-gray-600 flex-1">{orderBumpProduct.name}</span>
                  <span className="font-medium text-gray-900 text-right">
                    {formatPriceFromDB(product.order_bump_price)}
                  </span>
                </div>
              )}
              
              <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                <span className="font-medium text-gray-900">{t.total}</span>
                <span className="text-primary font-bold text-2xl">
                  {planData ? 
                    `${formatPriceFromDB(calculateTotalPrice())}/mês` :
                    formatPriceFromDB(calculateTotalPrice())}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Buy Button */}
          <Button
            onClick={handlePayment}
            size="lg"
            className="w-full h-14 text-lg font-semibold rounded-xl disabled:opacity-50"
            style={{ backgroundColor: buttonColor }}
            disabled={!selectedPaymentMethod || isProcessing}
          >
            {isProcessing ? t.processing : t.buyNow}
          </Button>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-8 px-4 bg-white border-t border-gray-100">
        <div className="max-w-lg mx-auto text-center space-y-4">
          {showKixicoPayLogo && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-gray-500 text-sm">{t.processedBy}</p>
              <img 
                src="/assets/kixicopay-vertical.png" 
                alt="KixicoPay" 
                className="h-24 w-auto object-contain"
                loading="lazy"
              />
              <p className="text-gray-500 text-sm">{t.allRights}</p>
            </div>
          )}
          
          <p className="text-[11px] text-gray-400 leading-relaxed">
            {t.legalText}{' '}
            <span className="text-primary font-medium">{sellerName}</span>{' '}
            {t.legalText2}{' '}
            <a 
              href="/termos-de-uso" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 underline hover:text-gray-700"
            >
              {t.termsOfUse}
            </a>
            ,{' '}
            <a 
              href="/politica-de-privacidade" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 underline hover:text-gray-700"
            >
              {t.privacyPolicy}
            </a>
            {' '}{t.and}{' '}
            <a 
              href="/politica-de-reembolso" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 underline hover:text-gray-700"
            >
              {t.refundPolicy}
            </a>.
          </p>
        </div>
      </footer>
    </div>
  );
}