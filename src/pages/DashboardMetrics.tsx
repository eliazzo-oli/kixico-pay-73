import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Users, Download, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { NotificationCenter } from '@/components/NotificationCenter';
import { MonthlySalesChart } from '@/components/MonthlySalesChart';
import { useAuth } from '@/hooks/useAuth';
import { usePlan } from '@/hooks/usePlan';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import kixicoPayLogo from "/lovable-uploads/aaa7ebd4-937a-41c9-ab8e-25102e62b1ed.png";
import { TrialBanner } from '@/components/TrialBanner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { pt } from 'date-fns/locale';

// Empty chart data structure for new users
const emptyChartData = {
  salesData: [
    { month: 'Jan', vendas: 0, receita: 0 },
    { month: 'Fev', vendas: 0, receita: 0 },
    { month: 'Mar', vendas: 0, receita: 0 },
    { month: 'Abr', vendas: 0, receita: 0 },
    { month: 'Mai', vendas: 0, receita: 0 },
    { month: 'Jun', vendas: 0, receita: 0 },
    { month: 'Jul', vendas: 0, receita: 0 },
    { month: 'Ago', vendas: 0, receita: 0 },
    { month: 'Set', vendas: 0, receita: 0 },
    { month: 'Out', vendas: 0, receita: 0 },
    { month: 'Nov', vendas: 0, receita: 0 },
    { month: 'Dez', vendas: 0, receita: 0 },
  ],
  conversionData: [
    { day: '1', clicks: 0, conversoes: 0 },
    { day: '2', clicks: 0, conversoes: 0 },
    { day: '3', clicks: 0, conversoes: 0 },
    { day: '4', clicks: 0, conversoes: 0 },
    { day: '5', clicks: 0, conversoes: 0 },
    { day: '6', clicks: 0, conversoes: 0 },
    { day: '7', clicks: 0, conversoes: 0 },
  ],
  productData: []
};

export default function DashboardMetrics() {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const { currentPlan, features, hasFeature, getPlanDisplayName } = usePlan();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    conversionRate: 0,
    activeCustomers: 0,
    averageTicket: 0,
    topSellingProduct: ''
  });
  const [salesData, setSalesData] = useState(emptyChartData.salesData);
  const [conversionData, setConversionData] = useState(emptyChartData.conversionData);
  const [productData, setProductData] = useState(emptyChartData.productData);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('last-30-days');
  const [rawTransactions, setRawTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchMetricsData();
    }
  }, [user, selectedPeriod]);

  const getDateRange = (period: string) => {
    const now = new Date();
    switch (period) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
      case 'last-7-days':
        return { start: subDays(now, 7), end: now };
      case 'last-30-days':
        return { start: subDays(now, 30), end: now };
      case 'this-week':
        return { start: startOfWeek(now, { locale: pt }), end: endOfWeek(now, { locale: pt }) };
      case 'this-month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'this-year':
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const fetchMetricsData = async () => {
    try {
      const dateRange = getDateRange(selectedPeriod);
      
      // Fetch transactions for the selected period
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('amount, status, created_at, customer_email, product_id, products(name)')
        .eq('user_id', user?.id)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (transactionsError) throw transactionsError;

      setRawTransactions(transactions || []);
      const completedTransactions = (transactions || []).filter(t => t.status === 'completed');
      
      // Calculate advanced metrics
      const totalRevenue = completedTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const totalSales = completedTransactions.length;
      const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
      
      // Calculate unique customers for the period
      const uniqueCustomers = new Set(completedTransactions.map(t => t.customer_email)).size;
      
      // Find top selling product
      const productSales = completedTransactions.reduce((acc, t) => {
        const productName = t.products?.name || 'Produto não identificado';
        acc[productName] = (acc[productName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topSellingProduct = Object.entries(productSales).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Nenhum';
      
      // Calculate conversion rate (simplified: completed vs total transactions)
      const allTransactions = transactions || [];
      const conversionRate = allTransactions.length > 0 ? (completedTransactions.length / allTransactions.length) * 100 : 0;
      
      setStats({
        totalRevenue,
        totalSales,
        conversionRate,
        activeCustomers: uniqueCustomers,
        averageTicket,
        topSellingProduct
      });

      // Generate sales data by period
      generateSalesChart(completedTransactions, selectedPeriod);
      generateProductChart(completedTransactions);
      
    } catch (error) {
      console.error('Error fetching metrics data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados de métricas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSalesChart = (transactions: any[], period: string) => {
    if (transactions.length === 0) {
      setSalesData([]);
      return;
    }

    const chartData: any[] = [];
    
    if (['today', 'yesterday'].includes(period)) {
      // Hourly data for day views
      for (let hour = 0; hour < 24; hour++) {
        const hourTransactions = transactions.filter(t => {
          const transactionHour = new Date(t.created_at).getHours();
          return transactionHour === hour;
        });
        
        chartData.push({
          period: `${hour}:00`,
          vendas: hourTransactions.length,
          receita: hourTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
        });
      }
    } else if (['last-7-days', 'this-week'].includes(period)) {
      // Daily data for week views
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      for (let i = 0; i < 7; i++) {
        const date = subDays(new Date(), 6 - i);
        const dayTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.created_at);
          return format(transactionDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        });
        
        chartData.push({
          period: days[date.getDay()],
          vendas: dayTransactions.length,
          receita: dayTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
        });
      }
    } else {
      // Monthly data for longer periods
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthlyData: Record<string, any> = {};
      
      transactions.forEach(t => {
        const date = new Date(t.created_at);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const monthName = months[date.getMonth()];
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { period: monthName, vendas: 0, receita: 0 };
        }
        
        monthlyData[monthKey].vendas += 1;
        monthlyData[monthKey].receita += Number(t.amount);
      });
      
      chartData.push(...Object.values(monthlyData));
    }
    
    setSalesData(chartData);
  };

  const generateProductChart = (transactions: any[]) => {
    if (transactions.length === 0) {
      setProductData([]);
      return;
    }

    const productSales = transactions.reduce((acc, t) => {
      const productName = t.products?.name || 'Produto não identificado';
      if (!acc[productName]) {
        acc[productName] = { name: productName, vendas: 0, receita: 0 };
      }
      acc[productName].vendas += 1;
      acc[productName].receita += Number(t.amount);
      return acc;
    }, {} as Record<string, any>);

    const colors = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];
    const chartData = Object.values(productSales).map((product: any, index) => ({
      ...product,
      fill: colors[index % colors.length]
    }));

    setProductData(chartData);
  };

  const exportToCSV = () => {
    if (rawTransactions.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Não há dados para exportar no período selecionado',
      });
      return;
    }

    const csvHeaders = [
      'Data',
      'Produto',
      'Cliente',
      'Valor',
      'Status',
      'Método de Pagamento'
    ];

    const csvData = rawTransactions.map(transaction => [
      format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm', { locale: pt }),
      transaction.products?.name || 'N/A',
      transaction.customer_email || 'N/A',
      `${Number(transaction.amount).toLocaleString('pt-AO')} AOA`,
      transaction.status,
      transaction.payment_method || 'N/A'
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-vendas-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Sucesso',
      description: 'Relatório exportado com sucesso!',
    });
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
          {/* Header */}
          <header className="border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <button 
                  onClick={handleLogoClick}
                  className="flex items-center hover:opacity-80 transition-opacity"
                >
                  <img 
                    src={kixicoPayLogo} 
                    alt="KixicoPay" 
                    className="h-20 sm:h-24 lg:h-32 w-auto"
                  />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <NotificationCenter />
                <UserAvatar 
                  userId={user?.id || ''} 
                  userEmail={user?.email || ''} 
                  onSignOut={handleSignOut} 
                />
              </div>
            </div>
          </header>

          <main className="flex-1 p-3 sm:p-4 lg:p-6">
            <TrialBanner />
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
              {!hasFeature('hasAdvancedReports') && (
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">Relatórios Avançados - Plano {getPlanDisplayName(currentPlan)}</h3>
                      <p className="text-sm text-muted-foreground">
                        Faça upgrade para o plano Profissional ou Empresarial para acessar relatórios avançados completos.
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/precos')}>
                      Fazer Upgrade
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Métricas de Desempenho</h1>
                  <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
                    Acompanhe o desempenho das suas vendas e conversões
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-[200px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Selecionar período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="yesterday">Ontem</SelectItem>
                      <SelectItem value="last-7-days">Últimos 7 dias</SelectItem>
                      <SelectItem value="last-30-days">Últimos 30 dias</SelectItem>
                      <SelectItem value="this-week">Esta semana</SelectItem>
                      <SelectItem value="this-month">Este mês</SelectItem>
                      <SelectItem value="this-year">Este ano</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    onClick={exportToCSV} 
                    variant="outline" 
                    className="flex items-center gap-2"
                    disabled={rawTransactions.length === 0}
                  >
                    <Download className="h-4 w-4" />
                    Exportar CSV
                  </Button>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Receita Total
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl lg:text-3xl font-bold text-foreground">
                      {stats.totalRevenue.toLocaleString('pt-AO')} AOA
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      No período selecionado
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total de Vendas
                    </CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl lg:text-3xl font-bold text-foreground">{stats.totalSales}</div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      Vendas completadas
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Taxa de Conversão
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl lg:text-3xl font-bold text-foreground">
                      {stats.conversionRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      Vendas vs tentativas
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Ticket Médio
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl lg:text-3xl font-bold text-foreground">
                      {stats.averageTicket.toLocaleString('pt-AO')} AOA
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      Valor médio por venda
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Clientes Ativos
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl lg:text-3xl font-bold text-foreground">{stats.activeCustomers}</div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      Clientes únicos
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Produto Top
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-bold text-foreground truncate" title={stats.topSellingProduct}>
                      {stats.topSellingProduct}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      Mais vendido
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Sales Chart */}
              <MonthlySalesChart />

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="text-foreground text-base sm:text-lg lg:text-xl">
                      Evolução de Vendas e Receita
                    </CardTitle>
                    <CardDescription>
                      Desempenho de vendas e receita no período selecionado
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-4 lg:p-6">
                    {salesData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={salesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis 
                            dataKey="period" 
                            fontSize={12}
                            className="text-muted-foreground"
                          />
                          <YAxis 
                            fontSize={12}
                            className="text-muted-foreground"
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              fontSize: '14px'
                            }}
                            formatter={(value, name) => [
                              name === 'receita' ? `${Number(value).toLocaleString('pt-AO')} AOA` : value,
                              name === 'receita' ? 'Receita' : 'Vendas'
                            ]}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="receita" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={3}
                            name="receita"
                            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="vendas" 
                            stroke="hsl(var(--secondary))" 
                            strokeWidth={3}
                            name="vendas"
                            dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[350px] flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhuma venda encontrada no período selecionado</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="text-foreground text-base sm:text-lg lg:text-xl">
                      Distribuição de Vendas por Produto
                    </CardTitle>
                    <CardDescription>
                      Performance individual dos produtos no período
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-4 lg:p-6">
                    {productData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={productData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis 
                            dataKey="name" 
                            fontSize={12}
                            className="text-muted-foreground"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            fontSize={12}
                            className="text-muted-foreground"
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              fontSize: '14px'
                            }}
                            formatter={(value, name) => [
                              name === 'receita' ? `${Number(value).toLocaleString('pt-AO')} AOA` : value,
                              name === 'receita' ? 'Receita' : 'Vendas'
                            ]}
                          />
                          <Bar dataKey="vendas" fill="hsl(var(--primary))" name="vendas" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[350px] flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhum produto vendido no período selecionado</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Analytics Chart */}
              <Card className="border-border/50 shadow-lg">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-foreground text-base sm:text-lg lg:text-xl">
                    Análise Detalhada por Produto
                  </CardTitle>
                  <CardDescription>
                    Comparação de receita e vendas por produto no período
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 sm:p-4 lg:p-6">
                  {productData.length > 0 ? (
                    <div className="flex flex-col xl:flex-row items-center gap-4 xl:gap-8">
                      <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height={350}>
                          <PieChart>
                            <Pie
                              data={productData}
                              cx="50%"
                              cy="50%"
                              outerRadius={120}
                              dataKey="receita"
                              label={({ name, percent }) => `${name.substring(0, 15)}${name.length > 15 ? '...' : ''} ${(percent * 100).toFixed(0)}%`}
                            >
                              {productData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                fontSize: '14px'
                              }}
                              formatter={(value, name) => [
                                `${Number(value).toLocaleString('pt-AO')} AOA`,
                                'Receita'
                              ]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="xl:min-w-[250px] w-full xl:w-auto">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-foreground mb-3">Desempenho por Produto</h4>
                          <div className="grid grid-cols-1 gap-3">
                            {productData.map((product, index) => (
                              <div key={index} className="p-3 bg-muted/20 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                  <div 
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: product.fill }}
                                  />
                                  <span className="text-sm font-semibold text-foreground truncate" title={product.name}>
                                    {product.name}
                                  </span>
                                </div>
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Vendas:</span>
                                    <span className="font-medium">{product.vendas}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Receita:</span>
                                    <span className="font-medium">{Number(product.receita).toLocaleString('pt-AO')} AOA</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Ticket Médio:</span>
                                    <span className="font-medium">
                                      {(product.receita / product.vendas).toLocaleString('pt-AO')} AOA
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[350px] flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum dado disponível para análise no período</p>
                        <p className="text-xs mt-2">Selecione um período diferente ou aguarde novas vendas</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}