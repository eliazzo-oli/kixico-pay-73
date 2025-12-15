import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { UserAvatar } from '@/components/UserAvatar';
import { NotificationCenter } from '@/components/NotificationCenter';
import { EnterpriseAnalytics } from '@/components/EnterpriseAnalytics';
import { EnterpriseReports } from '@/components/EnterpriseReports';
import { useAuth } from '@/hooks/useAuth';
import { usePlan } from '@/hooks/usePlan';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TrialBanner } from '@/components/TrialBanner';
import { SaleNotificationPopup } from '@/components/SaleNotificationPopup';
import KycBanner from '@/components/KycBanner';
import { useSaleNotifications } from '@/hooks/useSaleNotifications';
import { MobileTransactionList } from '@/components/MobileTransactionList';

import kixicoPayLogo from "/lovable-uploads/aaa7ebd4-937a-41c9-ab8e-25102e62b1ed.png";
import { 
  Plus, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  Copy, 
  ExternalLink, 
  ShoppingCart, 
  CreditCard,
  Activity,
  ArrowLeft,
  Home,
  Bell,
  BarChart3,
  FileText,
  Users,
  Zap,
  Crown,
  Download
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  active: boolean;
  created_at: string;
}

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

interface DashboardStats {
  totalSales: number;
  productsSold: number;
  netRevenue: number;
  totalTransactions: number;
}

interface UserProfile {
  name: string;
  fantasy_name?: string;
}

export default function Dashboard() {
  const { user, signOut, loading } = useAuth();
  const { currentPlan, features, canCreateProduct, getPlanDisplayName } = usePlan();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    productsSold: 0,
    netRevenue: 0,
    totalTransactions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { currentNotification, dismissCurrentNotification } = useSaleNotifications();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Real-time updates for transactions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('transaction-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Transaction update:', payload);
          fetchDashboardData(); // Refresh data when transactions change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, fantasy_name')
        .eq('user_id', user?.id)
        .single();
      
      if (profileData) {
        setUserProfile(profileData);
      }
      
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*, products(name)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) throw transactionsError;

      setProducts(productsData || []);
      setTransactions(transactionsData || []);

      // Calculate stats - only count actual sales (with product_id and completed status)
      const actualSales = transactionsData?.filter(t => 
        t.status === 'completed' && 
        t.product_id !== null && 
        t.amount > 0
      ) || [];
      const totalSales = actualSales.length;
      const netRevenue = actualSales.reduce((sum, t) => sum + t.amount, 0);
      const productsSold = actualSales.length;
      const totalTransactions = transactionsData?.length || 0;

      setStats({
        totalSales,
        productsSold,
        netRevenue,
        totalTransactions,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do dashboard',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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

  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao fazer logout',
        variant: 'destructive',
      });
    } else {
      navigate('/');
    }
  };

  const generatePaymentLink = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          product_id: productId,
          user_id: user?.id,
          customer_email: 'pending@customer.com',
          amount: products.find(p => p.id === productId)?.price || 0,
          status: 'pending',
          payment_link: `${window.location.origin}/checkout/${productId}`,
        })
        .select()
        .single();

      if (error) throw error;

      const paymentLink = `${window.location.origin}/checkout/${productId}`;
      
      await navigator.clipboard.writeText(paymentLink);
      toast({
        title: 'Sucesso',
        description: 'Link de pagamento copiado para a área de transferência!',
      });
    } catch (error) {
      console.error('Error generating payment link:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar link de pagamento',
        variant: 'destructive',
      });
    }
  };

  const exportTransactions = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.access_token) {
        toast({
          title: 'Erro',
          description: 'Usuário não autenticado',
          variant: 'destructive',
        });
        return;
      }

      const response = await supabase.functions.invoke('export-transactions', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      // The response data should be the CSV content
      const csvContent = response.data;
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `historico_transacoes_kixicopay_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Sucesso',
        description: 'Histórico de transações exportado com sucesso!',
      });
    } catch (error) {
      console.error('Error exporting transactions:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao exportar histórico de transações',
        variant: 'destructive',
      });
    }
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
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header - Compact on mobile */}
          <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm">
            <div className="flex items-center justify-between px-3 py-2 md:px-6 md:py-3">
              <div className="flex items-center gap-2 md:gap-4">
                <SidebarTrigger />
                {/* Logo - smaller on mobile */}
                <button 
                  onClick={handleLogoClick}
                  className="flex items-center hover:opacity-80 transition-opacity"
                >
                  <img 
                    src={kixicoPayLogo} 
                    alt="KixicoPay" 
                    className="h-12 md:h-20 w-auto"
                  />
                </button>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <NotificationCenter />
                <UserAvatar 
                  userId={user?.id || ''} 
                  userEmail={user?.email || ''} 
                  onSignOut={handleSignOut} 
                />
              </div>
            </div>
          </header>

          <main className="flex-1 p-3 md:p-6">
            <TrialBanner />
            <KycBanner />
            
            {/* Welcome Section - Compact on mobile */}
            {userProfile && (
              <div className="mb-4 md:mb-6 p-3 md:p-4 bg-primary/5 rounded-lg border border-border/30">
                <h2 className="text-base md:text-xl font-semibold text-foreground">
                  Bem-vindo, {userProfile.fantasy_name || userProfile.name}! 👋
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                  Gerencie seus produtos e acompanhe suas vendas.
                </p>
              </div>
            )}
            
            {/* Plan Status Bar - Compact on mobile */}
            <div className="mb-4 md:mb-6 p-3 md:p-4 bg-primary/5 rounded-lg border border-border/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0">
                <div>
                  <h3 className="text-sm md:text-base font-semibold text-foreground">Plano: {getPlanDisplayName(currentPlan)}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {products.length}/{features.maxProducts === Infinity ? '∞' : features.maxProducts} produtos
                  </p>
                  {features.hasAdvancedDashboard && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <Badge variant="default" className="text-[10px] md:text-xs px-1.5 py-0">
                        <Zap className="h-2.5 w-2.5 mr-0.5" />
                        Avançado
                      </Badge>
                      {features.hasEnterpriseReports && (
                        <Badge variant="secondary" className="text-[10px] md:text-xs px-1.5 py-0">
                          <FileText className="h-2.5 w-2.5 mr-0.5" />
                          Relatórios
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/precos')}>
                  Upgrade
                </Button>
              </div>
            </div>

            {/* Enhanced Dashboard for Empresarial Plan */}
            {currentPlan === 'empresarial' ? (
              <div className="space-y-4 md:space-y-6">
                <div className="p-3 md:p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="h-4 w-4 text-primary" />
                    <h3 className="text-sm md:text-base font-semibold text-foreground">Dashboard Empresarial</h3>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Analytics em tempo real, relatórios e saques sem taxa.
                  </p>
                </div>
                
                {/* Enhanced Stats Grid for Enterprise - 2 cols on mobile */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground">
                        Receita
                      </CardTitle>
                      <DollarSign className="h-3.5 w-3.5 md:h-5 md:w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg md:text-2xl font-bold text-foreground">
                        {stats.netRevenue.toLocaleString('pt-AO', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </div>
                      <p className="text-[10px] md:text-xs text-muted-foreground">AOA</p>
                    </CardContent>
                  </Card>

                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground">
                        Taxa Saque
                      </CardTitle>
                      <Zap className="h-3.5 w-3.5 md:h-5 md:w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg md:text-2xl font-bold text-foreground">
                        0%
                      </div>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Instantâneo</p>
                    </CardContent>
                  </Card>

                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground">
                        Produtos
                      </CardTitle>
                      <Package className="h-3.5 w-3.5 md:h-5 md:w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg md:text-2xl font-bold text-foreground">
                        {products.length}/∞
                      </div>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Ilimitados</p>
                    </CardContent>
                  </Card>

                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground">
                        API
                      </CardTitle>
                      <Activity className="h-3.5 w-3.5 md:h-5 md:w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg md:text-2xl font-bold text-foreground">
                        Ativo
                      </div>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Integrado</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Enterprise Features Showcase */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-border/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Analytics Avançado
                      </CardTitle>
                      <CardDescription>
                        Relatórios em tempo real e insights empresariais
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Taxa de Conversão</span>
                          <span className="font-semibold">87.5%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Ticket Médio</span>
                          <span className="font-semibold">
                            {(stats.netRevenue / Math.max(stats.totalSales, 1)).toLocaleString('pt-AO')} AOA
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">ROI</span>
                          <span className="font-semibold text-green-600">+342%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Relatórios Empresariais
                      </CardTitle>
                      <CardDescription>
                        Exportação avançada e análises detalhadas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="space-y-3">
                         <Button 
                           variant="outline" 
                           className="w-full justify-start"
                           onClick={() => navigate('/dashboard/metrics')}
                         >
                           <FileText className="h-4 w-4 mr-2" />
                           Relatório Mensal PDF
                         </Button>
                         <Button 
                           variant="outline" 
                           className="w-full justify-start"
                           onClick={() => navigate('/dashboard/metrics')}
                         >
                           <TrendingUp className="h-4 w-4 mr-2" />
                           Análise de Performance
                         </Button>
                         <Button 
                           variant="outline" 
                           className="w-full justify-start"
                           onClick={() => navigate('/dashboard/metrics')}
                         >
                           <Users className="h-4 w-4 mr-2" />
                           Insights de Clientes
                         </Button>
                        </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Transações Recentes - Enterprise Plan */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Transações Recentes</h2>
                    <div className="flex items-center gap-2">
                      <Button onClick={exportTransactions} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar Histórico
                      </Button>
                      <Button onClick={handleCreateProduct} variant="default" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Produto
                      </Button>
                    </div>
                  </div>
                  
                  <Card className="border-border/50 shadow-lg">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID da Transação</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Produto</TableHead>
                            <TableHead>Valor da Venda</TableHead>
                            <TableHead>Status do Pagamento</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                Nenhuma transação encontrada
                              </TableCell>
                            </TableRow>
                          ) : (
                            transactions.map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell className="font-mono text-sm">
                                  {transaction.id.substring(0, 8)}...
                                </TableCell>
                                <TableCell>
                                  {new Date(transaction.created_at).toLocaleDateString('pt-AO')}
                                </TableCell>
                                 <TableCell className="font-medium">
                                   {transaction.product_id 
                                     ? (transaction.products?.name || 'Produto não encontrado')
                                     : transaction.payment_method === 'saque'
                                       ? 'Saque Aprovado'
                                       : transaction.payment_method === 'credito'
                                         ? 'Ajuste Manual (Crédito)'
                                         : transaction.payment_method === 'debito'
                                           ? 'Ajuste Manual (Débito)'
                                           : 'Transação do Sistema'
                                   }
                                 </TableCell>
                                <TableCell className="font-semibold">
                                  {transaction.amount.toLocaleString('pt-AO', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })} AOA
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      transaction.status === 'completed'
                                        ? 'default'
                                        : transaction.status === 'pending'
                                        ? 'secondary'
                                        : 'destructive'
                                    }
                                  >
                                    {transaction.status === 'completed'
                                      ? 'Pago'
                                      : transaction.status === 'pending'
                                      ? 'Pendente'
                                      : 'Falhou'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => navigate(`/invoice/${transaction.id}`)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        const product = products.find(p => p.id === transaction.product_id);
                                        if (product) generatePaymentLink(product.id);
                                      }}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : features.hasAdvancedDashboard ? (
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Visão Geral
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="reports" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Relatórios
                  </TabsTrigger>
                  <TabsTrigger value="products" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Produtos
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 md:space-y-6">
                  {/* Enhanced Overview Stats - 2 cols on mobile */}
                  <div className="mb-4 md:mb-8">
                    <h2 className="text-sm md:text-lg font-semibold text-foreground mb-3">Visão Geral</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                      <Card className="border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                          <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground">
                            Vendas
                          </CardTitle>
                          <ShoppingCart className="h-3.5 w-3.5 md:h-5 md:w-5 text-primary" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-lg md:text-2xl font-bold text-foreground">
                            {stats.totalSales}
                          </div>
                          <p className="text-[10px] md:text-xs text-muted-foreground">
                            realizadas
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                          <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground">
                            Produtos
                          </CardTitle>
                          <Package className="h-3.5 w-3.5 md:h-5 md:w-5 text-primary" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-lg md:text-2xl font-bold text-foreground">
                            {stats.productsSold}
                          </div>
                          <p className="text-[10px] md:text-xs text-muted-foreground">
                            vendidos
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                          <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground">
                            Receita
                          </CardTitle>
                          <DollarSign className="h-3.5 w-3.5 md:h-5 md:w-5 text-primary" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-lg md:text-2xl font-bold text-foreground">
                            {stats.netRevenue.toLocaleString('pt-AO', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            })}
                          </div>
                          <p className="text-[10px] md:text-xs text-muted-foreground">
                            AOA
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                          <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground">
                            Crescimento
                          </CardTitle>
                          <TrendingUp className="h-3.5 w-3.5 md:h-5 md:w-5 text-primary" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-lg md:text-2xl font-bold text-foreground">
                            +12.5%
                          </div>
                          <p className="text-[10px] md:text-xs text-muted-foreground">
                            vs. mês anterior
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div className="mb-4 md:mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                      <h2 className="text-sm md:text-lg font-semibold text-foreground">Transações Recentes</h2>
                      <div className="flex items-center gap-2">
                        <Button onClick={exportTransactions} variant="outline" size="sm" className="flex-1 md:flex-none">
                          <Download className="h-3 w-3 mr-1" />
                          <span className="hidden md:inline">Exportar</span>
                        </Button>
                        <Button onClick={handleCreateProduct} variant="default" size="sm" className="flex-1 md:flex-none">
                          <Plus className="h-3 w-3 mr-1" />
                          <span className="hidden md:inline">Novo</span> Produto
                        </Button>
                      </div>
                    </div>
                    
                    {/* Mobile: Card List */}
                    <div className="md:hidden">
                      <Card className="border-border/50">
                        <CardContent className="p-2">
                          <MobileTransactionList 
                            transactions={transactions}
                            onViewInvoice={(id) => navigate(`/invoice/${id}`)}
                            onCopyLink={(productId) => generatePaymentLink(productId)}
                          />
                        </CardContent>
                      </Card>
                    </div>

                    {/* Desktop: Table */}
                    <Card className="border-border/50 hidden md:block">
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead>Produto</TableHead>
                              <TableHead>Valor</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transactions.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-sm">
                                  Nenhuma transação encontrada
                                </TableCell>
                              </TableRow>
                            ) : (
                              transactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                  <TableCell className="font-mono text-xs">
                                    {transaction.id.substring(0, 8)}...
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {new Date(transaction.created_at).toLocaleDateString('pt-AO')}
                                  </TableCell>
                                   <TableCell className="font-medium text-sm">
                                     {transaction.product_id 
                                       ? (transaction.products?.name || 'Produto não encontrado')
                                       : transaction.payment_method === 'saque'
                                         ? 'Saque Aprovado'
                                         : transaction.payment_method === 'credito'
                                           ? 'Ajuste (Crédito)'
                                           : transaction.payment_method === 'debito'
                                             ? 'Ajuste (Débito)'
                                             : 'Transação do Sistema'
                                     }
                                   </TableCell>
                                  <TableCell className="font-semibold text-sm">
                                    {transaction.amount.toLocaleString('pt-AO', {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0
                                    })} AOA
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        transaction.status === 'completed'
                                          ? 'default'
                                          : transaction.status === 'pending'
                                          ? 'secondary'
                                          : 'destructive'
                                      }
                                      className="text-xs"
                                    >
                                      {transaction.status === 'completed'
                                        ? 'Pago'
                                        : transaction.status === 'pending'
                                        ? 'Pendente'
                                        : 'Falhou'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => navigate(`/invoice/${transaction.id}`)}
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          const product = products.find(p => p.id === transaction.product_id);
                                          if (product) generatePaymentLink(product.id);
                                        }}
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  <EnterpriseAnalytics />
                </TabsContent>

                <TabsContent value="reports" className="space-y-6">
                  <EnterpriseReports />
                </TabsContent>

                <TabsContent value="products" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-foreground">Gestão de Produtos</h2>
                    <Button onClick={handleCreateProduct} variant="default">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Produto
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.length === 0 ? (
                      <div className="col-span-full">
                        <Card className="border-border/50">
                          <CardContent className="text-center py-8">
                            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">Nenhum produto cadastrado ainda</p>
                            <Button 
                              onClick={handleCreateProduct} 
                              variant="default" 
                              className="mt-4"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Criar Primeiro Produto
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      products.map((product) => (
                        <Card key={product.id} className="border-border/50 hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-medium text-foreground truncate">{product.name}</h4>
                              <Badge variant={product.active ? 'default' : 'secondary'}>
                                {product.active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                            <p className="text-lg font-bold text-primary mb-3">
                              {product.price.toLocaleString('pt-AO', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })} AOA
                            </p>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => generatePaymentLink(product.id)}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Copiar Link
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              // Basic Dashboard (for plans without advanced dashboard)
              <div className="space-y-8">
                {/* Advanced Metrics Access for Professional Plan */}
                {features.hasAdvancedReports && (
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">Relatórios Avançados Disponíveis</h3>
                        <p className="text-sm text-muted-foreground">
                          Acesse métricas detalhadas, gráficos e relatórios empresariais
                        </p>
                      </div>
                      <Button 
                        onClick={() => navigate('/dashboard/metrics')}
                        variant="default"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Ver Relatórios
                      </Button>
                    </div>
                  </div>
                )}
                {/* Visão Geral - Overview Stats */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Visão Geral</h2>
                    {features.hasAdvancedReports && (
                      <Button 
                        onClick={() => navigate('/dashboard/metrics')}
                        variant="outline"
                        size="sm"
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Métricas Avançadas
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total de Vendas
                        </CardTitle>
                        <ShoppingCart className="h-5 w-5 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                          {stats.totalSales}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          vendas realizadas
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Produtos Vendidos
                        </CardTitle>
                        <Package className="h-5 w-5 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                          {stats.productsSold}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          produtos vendidos
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Faturamento Líquido
                        </CardTitle>
                        <DollarSign className="h-5 w-5 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                          {stats.netRevenue.toLocaleString('pt-AO', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} AOA
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          receita líquida
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Produtos em Cards menores */}
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4">Meus Produtos</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.length === 0 ? (
                      <div className="col-span-full">
                        <Card className="border-border/50">
                          <CardContent className="text-center py-8">
                            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">Nenhum produto cadastrado ainda</p>
                            <Button 
                              onClick={handleCreateProduct} 
                              variant="default" 
                              className="mt-4"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Criar Primeiro Produto
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      products.map((product) => (
                        <Card key={product.id} className="border-border/50 hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-medium text-foreground truncate">{product.name}</h4>
                              <Badge variant={product.active ? 'default' : 'secondary'}>
                                {product.active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                            <p className="text-lg font-bold text-primary mb-3">
                              {product.price.toLocaleString('pt-AO', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })} AOA
                            </p>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => generatePaymentLink(product.id)}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Copiar Link
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
        
        {/* Sale Notification Popup */}
        <SaleNotificationPopup
          amount={currentNotification?.amount || 0}
          isVisible={!!currentNotification}
          onClose={dismissCurrentNotification}
        />
      </div>
    </SidebarProvider>
  );
}