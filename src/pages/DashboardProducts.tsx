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
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { usePlan } from '@/hooks/usePlan';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { TrialBanner } from '@/components/TrialBanner';

interface Product {
  id: string;
  name: string;
  price: number;
  status: 'active' | 'inactive';
  sales: number;
  revenue: number;
  created_at: string;
  description?: string;
}

// Interface for real Supabase product data
interface SupabaseProduct {
  id: string;
  name: string;
  price: number;
  active: boolean;
  created_at: string;
  description?: string;
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
        description: product.description || ''
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

  const handleSaveProduct = async (formData: FormData) => {
    try {
      const name = formData.get('name') as string;
      const price = parseFloat(formData.get('price') as string);
      const description = formData.get('description') as string;

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({ 
            name, 
            price,
            description 
          })
          .eq('id', editingProduct.id)
          .eq('user_id', user?.id);

        if (error) throw error;

        setProducts(prev => prev.map(p => 
          p.id === editingProduct.id 
            ? { ...p, name, price: price * 100, description }
            : p
        ));
        
        toast({
          title: "Produto atualizado",
          description: "As alterações foram salvas com sucesso.",
        });
      }
      
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

  const formatPrice = (priceInCents: number) => {
    const value = priceInCents / 100;
    return value.toLocaleString('pt-AO', {
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Produtos
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{totalProducts}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeProducts} ativos
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Produtos Ativos
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{activeProducts}</div>
                  <p className="text-xs text-success mt-1">
                    {((activeProducts / totalProducts) * 100).toFixed(0)}% do total
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Vendas
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{totalSales}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Todas as vendas
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Receita Total
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {formatPrice(totalRevenue)}
                  </div>
                  <p className="text-xs text-success mt-1">
                    Todos os produtos
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
                     {filteredProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                           <div className="flex flex-col items-center gap-4">
                             <Package className="h-12 w-12 text-muted-foreground" />
                             <div>
                               <p className="text-muted-foreground text-lg">Você ainda não tem produtos cadastrados</p>
                               <p className="text-muted-foreground text-sm mt-1">Comece criando seu primeiro produto para vender online</p>
                             </div>
                             <Button onClick={handleCreateProduct} className="mt-2">
                               <Plus className="h-4 w-4 mr-2" />
                               Criar Primeiro Produto
                             </Button>
                           </div>
                         </TableCell>
                       </TableRow>
                     ) : (
                       filteredProducts.map((product) => (
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
                                <form onSubmit={(e) => {
                                  e.preventDefault();
                                  const formData = new FormData(e.currentTarget);
                                  handleSaveProduct(formData);
                                }} className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="name">Nome do Produto</Label>
                                    <Input
                                      id="name"
                                      name="name"
                                      defaultValue={product.name}
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="price">Preço (AOA)</Label>
                                    <Input
                                      id="price"
                                      name="price"
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      defaultValue={(product.price / 100).toFixed(2)}
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="description">Descrição</Label>
                                    <Input
                                      id="description"
                                      name="description"
                                      defaultValue={product.description}
                                    />
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                      Cancelar
                                    </Button>
                                    <Button type="submit">
                                      Salvar Alterações
                                    </Button>
                                  </div>
                                </form>
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
                     )))
                     }
                   </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Product View Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
              <DialogContent className="sm:max-w-lg">
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