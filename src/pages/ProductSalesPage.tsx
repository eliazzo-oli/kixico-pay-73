import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, Shield, CheckCircle, Tag, ArrowLeft } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  currency: string;
  product_category: string | null;
  user_id: string;
  active: boolean;
}

interface SellerProfile {
  name: string;
  kyc_status: string | null;
  fantasy_name: string | null;
}

export default function ProductSalesPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('active', true)
        .single();

      if (productError || !productData) {
        setError('Produto não encontrado ou indisponível.');
        return;
      }

      setProduct(productData);

      // Fetch seller profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, kyc_status, fantasy_name')
        .eq('user_id', productData.user_id)
        .single();

      if (profileData) {
        setSeller(profileData);
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Erro ao carregar o produto.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return price.toLocaleString('pt-AO', {
      style: 'currency',
      currency: currency === 'BRL' ? 'BRL' : 'AOA',
    });
  };

  const handleBuyNow = () => {
    navigate(`/checkout?id=${productId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando produto...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold text-foreground">Produto não encontrado</h1>
          <p className="text-muted-foreground text-sm">{error || 'Este produto não está disponível.'}</p>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  const isSellerVerified = seller?.kyc_status === 'verificado';
  const sellerDisplayName = seller?.fantasy_name || seller?.name || 'Vendedor';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">por</span>
            <span className="font-medium text-foreground">{sellerDisplayName}</span>
            {isSellerVerified && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                <CheckCircle className="h-3 w-3" />
                Verificado
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pb-32">
        {/* Product Image */}
        <div className="relative mt-4 md:mt-8">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full aspect-video md:aspect-[16/9] object-cover rounded-2xl shadow-lg"
              loading="eager"
              width={800}
              height={450}
            />
          ) : (
            <div className="w-full aspect-video md:aspect-[16/9] bg-muted rounded-2xl flex items-center justify-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="mt-6 md:mt-10 space-y-6">
          {/* Category Badge */}
          {product.product_category && (
            <Badge variant="outline" className="gap-1.5">
              <Tag className="h-3 w-3" />
              {product.product_category}
            </Badge>
          )}

          {/* Title */}
          <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-tight">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-5xl font-bold text-primary">
              {formatPrice(product.price, product.currency)}
            </span>
            <span className="text-muted-foreground text-sm">{product.currency}</span>
          </div>

          {/* Description */}
          {product.description && (
            <div className="prose prose-sm md:prose-base max-w-none">
              <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>Pagamento Seguro</span>
            </div>
            {isSellerVerified && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Vendedor Verificado</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Sticky CTA Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Button 
            onClick={handleBuyNow}
            size="xl"
            className="w-full h-12 md:h-14 text-base md:text-lg font-semibold shadow-lg"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            COMPRAR AGORA
          </Button>
        </div>
      </div>

      {/* Footer with KixicoPay Logo */}
      <div className="fixed bottom-20 md:bottom-24 left-0 right-0 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground/60">
          <span>Processado por</span>
          <span className="font-semibold">KixicoPay</span>
        </div>
      </div>
    </div>
  );
}
