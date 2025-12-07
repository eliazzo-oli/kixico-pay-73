import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Edit2, Trash2, Search, Package, TrendingUp, ArrowLeft, Share2, Copy, Eye } from 'lucide-react';
import { MobileProductList } from '@/components/MobileProductList';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { usePlan } from '@/hooks/usePlan';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { TrialBanner } from '@/components/TrialBanner';
import CouponManager from '@/components/CouponManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

interface Product {
  id: string;
  name: string;
  price: number;
  status: 'active' | 'inactive';
  sales: number;
  revenue: number;
  created_at: string;
  description?: string;
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
}

// Interface for real Supabase product data
interface SupabaseProduct {
  id: string;
  name: string;
  price: number;
  active: boolean;
  created_at: string;
  description?: string;
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
}

export default function DashboardProducts() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { currentPlan, features, canCreateProduct, getPlanDisplayName } = usePlan();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPaymentMethods, setEditingPaymentMethods] = useState<string[]>([]);
  
  // Controlled form states
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBackgroundColor, setEditBackgroundColor] = useState('#ffffff');
  const [editTextColor, setEditTextColor] = useState('#000000');
  const [editButtonColor, setEditButtonColor] = useState('#6366f1');
  const [editPixelId, setEditPixelId] = useState('');
  const [editTimerEnabled, setEditTimerEnabled] = useState(false);
  const [editShowKixicoPayLogo, setEditShowKixicoPayLogo] = useState(true);
  
  // Order Bump states
  const [editOrderBumpEnabled, setEditOrderBumpEnabled] = useState(false);
  const [editOrderBumpProductId, setEditOrderBumpProductId] = useState('');
  const [editOrderBumpPrice, setEditOrderBumpPrice] = useState('');
  const [editOrderBumpHeadline, setEditOrderBumpHeadline] = useState('');
  
  // New product fields
  const [editProductCategory, setEditProductCategory] = useState('');
  const [editDeliveryLink, setEditDeliveryLink] = useState('');
  const [editSupportContact, setEditSupportContact] = useState('');
  const [editCurrency, setEditCurrency] = useState('AOA');
  
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Transform data and calculate stats from transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('product_id, amount, status')
        .eq('user_id', user?.id);

      if (transactionsError) throw transactionsError;

      // Calculate sales and revenue per product
      const productStats = (transactionsData || []).reduce((acc: any, transaction: any) => {
        const productId = transaction.product_id;
        if (!acc[productId]) {
          acc[productId] = { sales: 0, revenue: 0 };
        }
        if (transaction.status === 'completed') {
          acc[productId].sales += 1;
          acc[productId].revenue += transaction.amount;
        }
        return acc;
      }, {});

      // Transform products data to include stats
      const productsWithStats = (productsData || []).map((product: SupabaseProduct) => ({
        id: product.id,
        name: product.name,
        price: product.price * 100, // Convert to cents for consistency
        status: product.active ? 'active' as const : 'inactive' as const,
        sales: productStats[product.id]?.sales || 0,
        revenue: productStats[product.id]?.revenue || 0,
        created_at: product.created_at,
        description: product.description || '',
        checkout_background_color: product.checkout_background_color,
        checkout_text_color: product.checkout_text_color,
        checkout_button_color: product.checkout_button_color,
        checkout_timer_enabled: product.checkout_timer_enabled,
        checkout_show_kixicopay_logo: product.checkout_show_kixicopay_logo,
        accepted_payment_methods: product.accepted_payment_methods,
        pixel_id: product.pixel_id,
        order_bump_enabled: product.order_bump_enabled,
        order_bump_product_id: product.order_bump_product_id,
        order_bump_price: product.order_bump_price,
        order_bump_headline: product.order_bump_headline,
      }));

      setProducts(productsWithStats);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar produtos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const totalSales = products.reduce((sum, p) => sum + p.sales, 0);
  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);

  const handleToggleStatus = async (productId: string) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const newStatus = product.status === 'active' ? false : true;
      
      const { error } = await supabase
        .from('products')
        .update({ active: newStatus })
        .eq('id', productId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, status: newStatus ? 'active' : 'inactive' }
          : p
      ));
      
      toast({
        title: "Status atualizado",
        description: "O status do produto foi alterado com sucesso.",
      });
    } catch (error) {
      console.error('Error updating product status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do produto.",
        variant: 'destructive',
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditPrice(product.price.toString());
    setEditDescription(product.description || '');
    setEditBackgroundColor(product.checkout_background_color || '#ffffff');
    setEditTextColor(product.checkout_text_color || '#000000');
    setEditButtonColor(product.checkout_button_color || '#6366f1');
    setEditTimerEnabled(product.checkout_timer_enabled || false);
    setEditShowKixicoPayLogo(product.checkout_show_kixicopay_logo !== false);
    setEditPixelId(product.pixel_id || '');
    setEditingPaymentMethods(
      product.accepted_payment_methods && product.accepted_payment_methods.length > 0 
        ? product.accepted_payment_methods 
        : ['reference', 'multicaixa', 'paypal_ao']
    );
    setEditOrderBumpEnabled(product.order_bump_enabled || false);
    setEditOrderBumpProductId(product.order_bump_product_id || '');
    setEditOrderBumpPrice(product.order_bump_price ? product.order_bump_price.toString() : '');
    setEditOrderBumpHeadline(product.order_bump_headline || '');
    setEditProductCategory(product.product_category || '');
    setEditDeliveryLink(product.product_delivery_link || '');
    setEditSupportContact(product.seller_support_contact || '');
    setEditCurrency((product as any).currency || 'AOA');
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== productId));
      toast({
        title: "Produto removido",
        description: "O produto foi removido com sucesso.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover produto.",
        variant: 'destructive',
      });
    }
  };

  const handleSaveProduct = async () => {
    try {
      if (!editingProduct) return;

      const price = parseFloat(editPrice);
      if (isNaN(price)) {
        toast({
          title: "Erro",
          description: "Preço inválido.",
          variant: 'destructive',
        });
        return;
      }

      const orderBumpPrice = editOrderBumpPrice ? parseFloat(editOrderBumpPrice) : null;
      if (editOrderBumpEnabled && editOrderBumpPrice && isNaN(orderBumpPrice!)) {
        toast({
          title: "Erro",
          description: "Preço do Order Bump inválido.",
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('products')
        .update({ 
          name: editName, 
          price: price,
          description: editDescription,
          checkout_background_color: editBackgroundColor,
          checkout_text_color: editTextColor,
          checkout_button_color: editButtonColor,
          checkout_timer_enabled: editTimerEnabled,
          checkout_show_kixicopay_logo: editShowKixicoPayLogo,
          accepted_payment_methods: editingPaymentMethods.length > 0 ? editingPaymentMethods : null,
          pixel_id: editPixelId || null,
          order_bump_enabled: editOrderBumpEnabled,
          order_bump_product_id: editOrderBumpEnabled && editOrderBumpProductId ? editOrderBumpProductId : null,
          order_bump_price: editOrderBumpEnabled && orderBumpPrice ? orderBumpPrice : null,
          order_bump_headline: editOrderBumpEnabled && editOrderBumpHeadline ? editOrderBumpHeadline : null,
          product_category: editProductCategory || null,
          product_delivery_link: editDeliveryLink || null,
          seller_support_contact: editSupportContact || null,
          currency: editCurrency,
        })
        .eq('id', editingProduct.id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id 
          ? { 
              ...p, 
              name: editName, 
              price: price, 
              description: editDescription,
              checkout_background_color: editBackgroundColor,
              checkout_text_color: editTextColor,
              checkout_button_color: editButtonColor,
              checkout_timer_enabled: editTimerEnabled,
              checkout_show_kixicopay_logo: editShowKixicoPayLogo,
              accepted_payment_methods: editingPaymentMethods.length > 0 ? editingPaymentMethods : null,
              pixel_id: editPixelId || null,
            }
          : p
      ));
      
      toast({
        title: "Produto atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
      
      setIsDialogOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar produto.",
        variant: 'destructive',
      });
    }
  };

  const handleCreateProduct = async () => {
    const canCreate = await canCreateProduct(products.length);
    if (!canCreate) {
      toast({
        title: 'Limite de produtos atingido',
        description: `Seu plano ${getPlanDisplayName(currentPlan)} permite até ${features.maxProducts} produtos. Faça upgrade para criar mais produtos.`,
        variant: 'destructive',
      });
      return;
    }
    navigate('/products/new');
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-AO', {
      style: 'currency',
      currency: 'AOA',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-AO');
  };

  const handleCopyProductLink = async (productId: string, productName: string) => {
    const baseUrl = window.location.origin;
    const productLink = `${baseUrl}/checkout?id=${productId}`;
    
    try {
      await navigator.clipboard.writeText(productLink);
      toast({
        title: "Link copiado!",
        description: `Link do produto "${productName}" copiado para a área de transferência.`,
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link. Tente novamente.",
        variant: 'destructive',
      });
    }
  };

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product);
    setIsViewDialogOpen(true);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <TrialBanner />
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Meus Produtos</h1>
                  <p className="text-muted-foreground mt-2">
                    Gerencie todos os seus produtos digitais ({products.length}/{features.maxProducts === Infinity ? '∞' : features.maxProducts} - Plano {getPlanDisplayName(currentPlan)})
                  </p>
                </div>
              </div>
              <Button onClick={handleCreateProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </div>

            {/* Stats Cards - Grid 2 cols on mobile */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                    Total Produtos
                  </CardTitle>
                  <Package className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold text-foreground">{totalProducts}</div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
                    {activeProducts} ativos
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                    Ativos
                  </CardTitle>
                  <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold text-foreground">{activeProducts}</div>
                  <p className="text-[10px] md:text-xs text-success mt-0.5 md:mt-1">
                    {totalProducts > 0 ? ((activeProducts / totalProducts) * 100).toFixed(0) : 0}%
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                    Vendas
                  </CardTitle>
                  <Package className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold text-foreground">{totalSales}</div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
                    Total
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                    Receita
                  </CardTitle>
                  <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold text-foreground">
                    {formatPrice(totalRevenue)}
                  </div>
                  <p className="text-[10px] md:text-xs text-success mt-0.5 md:mt-1">
                    Total
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Products Table */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-foreground">Lista de Produtos</CardTitle>
                    <CardDescription>
                      Gerencie seus produtos, preços e status
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar produtos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Package className="h-12 w-12 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-muted-foreground text-lg">Você ainda não tem produtos cadastrados</p>
                      <p className="text-muted-foreground text-sm mt-1">Comece criando seu primeiro produto para vender online</p>
                    </div>
                    <Button onClick={handleCreateProduct} className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Produto
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Mobile: Card List */}
                    <div className="md:hidden">
                      <MobileProductList
                        products={filteredProducts}
                        onToggleStatus={handleToggleStatus}
                        onEdit={handleEditProduct}
                        onView={handleViewProduct}
                        onCopyLink={handleCopyProductLink}
                        onDelete={handleDeleteProduct}
                        formatPrice={formatPrice}
                      />
                    </div>
                    
                    {/* Desktop: Table */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome do Produto</TableHead>
                            <TableHead>Preço</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Vendas</TableHead>
                            <TableHead>Receita</TableHead>
                            <TableHead>Data de Criação</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold text-foreground">{product.name}</div>
                            {product.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatPrice(product.price)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                              {product.status === 'active' ? 'Ativo' : 'Inativo'}
                            </Badge>
                            <Switch
                              checked={product.status === 'active'}
                              onCheckedChange={() => handleToggleStatus(product.id)}
                            />
                          </div>
                        </TableCell>
                        <TableCell>{product.sales}</TableCell>
                        <TableCell className="font-semibold">
                          {formatPrice(product.revenue)}
                        </TableCell>
                        <TableCell>{formatDate(product.created_at)}</TableCell>
                         <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyProductLink(product.id, product.name)}
                                className="text-primary hover:text-primary"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleViewProduct(product)}
                                 className="text-muted-foreground hover:text-foreground"
                                 title="Visualizar produto"
                               >
                                 <Eye className="h-4 w-4" />
                               </Button>
                             <Dialog open={isDialogOpen && editingProduct?.id === product.id} onOpenChange={setIsDialogOpen}>
                               <DialogTrigger asChild>
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => handleEditProduct(product)}
                                 >
                                   <Edit2 className="h-4 w-4" />
                                 </Button>
                               </DialogTrigger>
                               <DialogContent className="sm:max-w-md">
                                 <DialogHeader>
                                   <DialogTitle>Editar Produto</DialogTitle>
                                   <DialogDescription>
                                     Faça alterações nas informações do seu produto.
                                   </DialogDescription>
                                 </DialogHeader>
                                  <div className="space-y-4">
                                     <Tabs defaultValue="produto" className="w-full">
                                      <TabsList className="grid w-full grid-cols-4">
                                          <TabsTrigger value="produto">Produto</TabsTrigger>
                                          <TabsTrigger value="checkout">Checkout</TabsTrigger>
                                          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
                                          <TabsTrigger value="marketing">Marketing</TabsTrigger>
                                        </TabsList>
                                      
                                       <TabsContent value="produto" className="space-y-4 mt-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="name">Nome do Produto</Label>
                                          <Input
                                            id="name"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            required
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="price">Preço (AOA)</Label>
                                          <Input
                                            id="price"
                                            type="text"
                                            value={editPrice}
                                            onChange={(e) => {
                                              const value = e.target.value.replace(/\D/g, '');
                                              setEditPrice(value);
                                            }}
                                            placeholder="Ex: 10 000"
                                            onBlur={(e) => {
                                              const value = e.target.value.replace(/\D/g, '');
                                              if (value) {
                                                const formatted = parseInt(value).toLocaleString('pt-PT');
                                                e.target.value = formatted;
                                              }
                                            }}
                                            onFocus={(e) => {
                                              const value = e.target.value.replace(/\D/g, '');
                                              e.target.value = value;
                                            }}
                                            required
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="description">Descrição</Label>
                                          <Textarea
                                            id="description"
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            rows={3}
                                          />
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <Label htmlFor="product-category">Categoria do Produto</Label>
                                          <select
                                            id="product-category"
                                            value={editProductCategory}
                                            onChange={(e) => setEditProductCategory(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                          >
                                            <option value="">Selecione uma categoria</option>
                                            <option value="Curso Online">Curso Online</option>
                                            <option value="Ebook">Ebook</option>
                                            <option value="Mentoria">Mentoria</option>
                                            <option value="Evento">Evento</option>
                                            <option value="Serviço">Serviço</option>
                                            <option value="Software">Software</option>
                                            <option value="Outro">Outro</option>
                                          </select>
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <Label htmlFor="product-currency">Moeda do Produto *</Label>
                                          <select
                                            id="product-currency"
                                            value={editCurrency}
                                            onChange={(e) => setEditCurrency(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                          >
                                            <option value="AOA">AOA - Kwanza Angolano</option>
                                            <option value="BRL">BRL - Real Brasileiro</option>
                                          </select>
                                          <p className="text-xs text-muted-foreground">
                                            A moeda determina quais métodos de pagamento serão exibidos no checkout.
                                          </p>
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor="delivery-link">Link de Entrega do Produto *</Label>
                                          <Input
                                            id="delivery-link"
                                            type="url"
                                            value={editDeliveryLink}
                                            onChange={(e) => setEditDeliveryLink(e.target.value)}
                                            placeholder="https://..."
                                          />
                                          <p className="text-xs text-muted-foreground">
                                            O seu cliente receberá este link imediatamente após o pagamento ser aprovado.
                                          </p>
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor="support-contact">Contacto de Suporte ao Cliente *</Label>
                                          <Input
                                            id="support-contact"
                                            type="text"
                                            value={editSupportContact}
                                            onChange={(e) => setEditSupportContact(e.target.value)}
                                            placeholder="seuemail@exemplo.com ou +244 900 000 000"
                                          />
                                          <p className="text-xs text-muted-foreground">
                                            O seu cliente verá este contacto (e-mail ou WhatsApp) na página de sucesso e no e-mail de confirmação.
                                          </p>
                                        </div>
                                      </TabsContent>
                                     
                                      <TabsContent value="checkout" className="space-y-4 mt-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="backgroundColor">Cor de Fundo</Label>
                                          <div className="flex gap-2 items-center">
                                            <Input
                                              id="backgroundColor"
                                              type="color"
                                              value={editBackgroundColor}
                                              onChange={(e) => setEditBackgroundColor(e.target.value)}
                                              className="w-20 h-10 cursor-pointer"
                                            />
                                            <Input
                                              type="text"
                                              value={editBackgroundColor}
                                              readOnly
                                              className="flex-1 text-sm"
                                            />
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor="textColor">Cor do Texto</Label>
                                          <div className="flex gap-2 items-center">
                                            <Input
                                              id="textColor"
                                              type="color"
                                              value={editTextColor}
                                              onChange={(e) => setEditTextColor(e.target.value)}
                                              className="w-20 h-10 cursor-pointer"
                                            />
                                            <Input
                                              type="text"
                                              value={editTextColor}
                                              readOnly
                                              className="flex-1 text-sm"
                                            />
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor="buttonColor">Cor do Botão</Label>
                                          <div className="flex gap-2 items-center">
                                            <Input
                                              id="buttonColor"
                                              type="color"
                                              value={editButtonColor}
                                              onChange={(e) => setEditButtonColor(e.target.value)}
                                              className="w-20 h-10 cursor-pointer"
                                            />
                                            <Input
                                              type="text"
                                              value={editButtonColor}
                                              readOnly
                                              className="flex-1 text-sm"
                                            />
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                          <div className="space-y-0.5">
                                            <Label htmlFor="timerEnabled">Ativar Temporizador de Escassez</Label>
                                            <p className="text-sm text-muted-foreground">
                                              Mostra uma contagem regressiva de 15 minutos
                                            </p>
                                          </div>
                                          <Switch
                                            id="timerEnabled"
                                            checked={editTimerEnabled}
                                            onCheckedChange={setEditTimerEnabled}
                                          />
                                        </div>

                                        <div className="flex items-center justify-between">
                                          <div className="space-y-0.5">
                                            <Label htmlFor="showKixicoPayLogo">Mostrar logotipo da KixicoPay no checkout</Label>
                                            <p className="text-sm text-muted-foreground">
                                              Exibir ou ocultar o logotipo da KixicoPay
                                            </p>
                                          </div>
                                          <Switch
                                            id="showKixicoPayLogo"
                                            checked={editShowKixicoPayLogo}
                                            onCheckedChange={setEditShowKixicoPayLogo}
                                          />
                                        </div>
                                       </TabsContent>
                                      
                                      <TabsContent value="pagamentos" className="space-y-4 mt-4">
                                        <div className="space-y-4">
                                          <h4 className="font-medium text-foreground">Métodos de Pagamento Aceitos</h4>
                                          <p className="text-sm text-muted-foreground">
                                            Escolha quais métodos de pagamento deseja aceitar para este produto
                                          </p>
                                          
                                          <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                                              <div className="flex items-center gap-3">
                                                <img 
                                                  src="/assets/express.png" 
                                                  alt="Pagamento por Referência" 
                                                  className="h-10 w-auto object-contain"
                                                />
                                                <div>
                                                  <p className="font-medium text-foreground">Pagamento por Referência</p>
                                                  <p className="text-sm text-muted-foreground">Pagamento via referência bancária</p>
                                                </div>
                                              </div>
                                              <Switch
                                                checked={editingPaymentMethods.includes('reference')}
                                                onCheckedChange={(checked) => {
                                                  if (checked) {
                                                    setEditingPaymentMethods(prev => [...prev, 'reference']);
                                                  } else {
                                                    setEditingPaymentMethods(prev => prev.filter(m => m !== 'reference'));
                                                  }
                                                }}
                                              />
                                            </div>

                                            <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                                              <div className="flex items-center gap-3">
                                                <img 
                                                  src="/assets/multicaixa.png" 
                                                  alt="Multicaixa Express" 
                                                  className="h-10 w-auto object-contain"
                                                />
                                                <div>
                                                  <p className="font-medium text-foreground">Multicaixa Express</p>
                                                  <p className="text-sm text-muted-foreground">Pagamento via Multicaixa</p>
                                                </div>
                                              </div>
                                              <Switch
                                                checked={editingPaymentMethods.includes('multicaixa')}
                                                onCheckedChange={(checked) => {
                                                  if (checked) {
                                                    setEditingPaymentMethods(prev => [...prev, 'multicaixa']);
                                                  } else {
                                                    setEditingPaymentMethods(prev => prev.filter(m => m !== 'multicaixa'));
                                                  }
                                                }}
                                              />
                                            </div>

                                            <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                                              <div className="flex items-center gap-3">
                                                <img 
                                                  src="/assets/paypay_afri.png" 
                                                  alt="PayPay Afri" 
                                                  className="h-10 w-auto object-contain"
                                                />
                                                <div>
                                                  <p className="font-medium text-foreground">PayPay Afri</p>
                                                  <p className="text-sm text-muted-foreground">PayPay África</p>
                                                </div>
                                              </div>
                                              <Switch
                                                checked={editingPaymentMethods.includes('paypal_ao')}
                                                onCheckedChange={(checked) => {
                                                  if (checked) {
                                                    setEditingPaymentMethods(prev => [...prev, 'paypal_ao']);
                                                  } else {
                                                    setEditingPaymentMethods(prev => prev.filter(m => m !== 'paypal_ao'));
                                                  }
                                                }}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                       </TabsContent>
                                       
                                       <TabsContent value="marketing" className="space-y-4 mt-4">
                                         <div className="space-y-6">
                                           {/* Pixel Tracking Section */}
                                           <div className="space-y-4">
                                             <h4 className="font-medium text-foreground">Rastreamento de Anúncios</h4>
                                             <p className="text-sm text-muted-foreground">
                                               Configure o rastreamento de conversões para otimizar os seus anúncios
                                             </p>
                                             
                                             <div className="space-y-2">
                                               <Label htmlFor="pixelId">Pixel ID</Label>
                                               <Input
                                                 id="pixelId"
                                                 type="text"
                                                 value={editPixelId}
                                                 onChange={(e) => setEditPixelId(e.target.value)}
                                                 placeholder="Ex: 1234567890"
                                               />
                                               <p className="text-xs text-muted-foreground">
                                                 Insira aqui o seu Pixel ID do Facebook, TikTok ou outra plataforma de anúncios para rastrear as suas vendas.
                                               </p>
                                             </div>
                                           </div>

                                           {/* Order Bump Section */}
                                           <div className="space-y-4 pt-4 border-t border-border/50">
                                             <div className="flex items-center justify-between">
                                               <div className="space-y-0.5">
                                                 <h4 className="font-medium text-foreground">Order Bump</h4>
                                                 <p className="text-sm text-muted-foreground">
                                                   Ofereça um produto adicional no checkout para aumentar o valor médio das vendas
                                                 </p>
                                               </div>
                                               <Switch
                                                 checked={editOrderBumpEnabled}
                                                 onCheckedChange={setEditOrderBumpEnabled}
                                               />
                                             </div>

                                             {editOrderBumpEnabled && (
                                               <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                                                 <div className="space-y-2">
                                                   <Label htmlFor="orderBumpProduct">Produto do Order Bump</Label>
                                                   <select
                                                     id="orderBumpProduct"
                                                     value={editOrderBumpProductId}
                                                     onChange={(e) => setEditOrderBumpProductId(e.target.value)}
                                                     className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                   >
                                                     <option value="">Selecione um produto</option>
                                                     {products
                                                       .filter(p => p.id !== editingProduct?.id && p.status === 'active')
                                                       .map(p => (
                                                         <option key={p.id} value={p.id}>
                                                           {p.name} - {formatPrice(p.price)}
                                                         </option>
                                                       ))}
                                                   </select>
                                                   <p className="text-xs text-muted-foreground">
                                                     Escolha qual produto adicional deseja oferecer
                                                   </p>
                                                 </div>

                                                  <div className="space-y-2">
                                                    <Label htmlFor="orderBumpPrice">Preço do Order Bump (AOA)</Label>
                                                    <Input
                                                      id="orderBumpPrice"
                                                      type="text"
                                                      value={editOrderBumpPrice}
                                                      onChange={(e) => {
                                                        const value = e.target.value.replace(/\D/g, '');
                                                        setEditOrderBumpPrice(value);
                                                      }}
                                                      placeholder="Ex: 2 500"
                                                      onBlur={(e) => {
                                                        const value = e.target.value.replace(/\D/g, '');
                                                        if (value) {
                                                          const formatted = parseInt(value).toLocaleString('pt-PT');
                                                          e.target.value = formatted;
                                                        }
                                                      }}
                                                      onFocus={(e) => {
                                                        const value = e.target.value.replace(/\D/g, '');
                                                        e.target.value = value;
                                                      }}
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                      Defina um preço especial com desconto para incentivar a compra
                                                    </p>
                                                  </div>

                                                 <div className="space-y-2">
                                                   <Label htmlFor="orderBumpHeadline">Título da Oferta</Label>
                                                   <Input
                                                     id="orderBumpHeadline"
                                                     type="text"
                                                     value={editOrderBumpHeadline}
                                                     onChange={(e) => setEditOrderBumpHeadline(e.target.value)}
                                                     placeholder="Ex: Sim, eu quero adicionar este bónus!"
                                                   />
                                                   <p className="text-xs text-muted-foreground">
                                                     Crie uma mensagem atrativa para a oferta adicional
                                                   </p>
                                                 </div>
                                               </div>
                                             )}
                                           </div>
                                         </div>
                                       </TabsContent>
                                      </Tabs>
                                     <div className="flex justify-end space-x-2 mt-6">
                                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancelar
                                      </Button>
                                      <Button onClick={handleSaveProduct}>
                                        Salvar Alterações
                                      </Button>
                                    </div>
                                  </div>
                               </DialogContent>
                            </Dialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja remover o produto "{product.name}"? 
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            {/* Product View Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
              <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Visualizar Produto</DialogTitle>
                  <DialogDescription>
                    Informações detalhadas do produto
                  </DialogDescription>
                </DialogHeader>
                {viewingProduct && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                        <p className="text-foreground font-semibold">{viewingProduct.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Preço</Label>
                        <p className="text-foreground font-semibold">{formatPrice(viewingProduct.price)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                        <div className="mt-1">
                          <Badge variant={viewingProduct.status === 'active' ? 'default' : 'secondary'}>
                            {viewingProduct.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Data de Criação</Label>
                        <p className="text-foreground">{formatDate(viewingProduct.created_at)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Vendas</Label>
                        <p className="text-foreground font-semibold">{viewingProduct.sales}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Receita</Label>
                        <p className="text-foreground font-semibold">{formatPrice(viewingProduct.revenue)}</p>
                      </div>
                    </div>

                    {viewingProduct.description && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Descrição</Label>
                        <p className="text-foreground mt-1">{viewingProduct.description}</p>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <Label className="text-sm font-medium text-muted-foreground">Link do Produto</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          value={`${window.location.origin}/checkout?id=${viewingProduct.id}`}
                          readOnly
                          className="text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyProductLink(viewingProduct.id, viewingProduct.name)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Coupon Management Section */}
                    <div className="pt-4 border-t">
                      <CouponManager 
                        productId={viewingProduct.id} 
                        productName={viewingProduct.name} 
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                        Fechar
                      </Button>
                      <Button onClick={() => {
                        setIsViewDialogOpen(false);
                        handleEditProduct(viewingProduct);
                      }}>
                        Editar Produto
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}