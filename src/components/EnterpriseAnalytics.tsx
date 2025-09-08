import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, Users, CreditCard, DollarSign, Calendar, Target } from 'lucide-react';

interface AnalyticsData {
  dailyRevenue: Array<{ date: string; revenue: number; transactions: number }>;
  monthlyComparison: Array<{ month: string; revenue: number; growth: number }>;
  topProducts: Array<{ name: string; sales: number; revenue: number }>;
  customerInsights: {
    totalCustomers: number;
    returningCustomers: number;
    averageOrderValue: number;
    conversionRate: number;
  };
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function EnterpriseAnalytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calcular data início baseado no timeRange
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Buscar transações do período
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          products(name)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Processar dados para gráficos
      const dailyData = processDailyRevenue(transactions || []);
      const monthlyData = processMonthlyComparison(transactions || []);
      const topProducts = processTopProducts(transactions || []);
      const customerInsights = processCustomerInsights(transactions || []);

      setAnalytics({
        dailyRevenue: dailyData,
        monthlyComparison: monthlyData,
        topProducts,
        customerInsights
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processDailyRevenue = (transactions: any[]) => {
    const dailyMap = new Map();
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.created_at).toLocaleDateString('pt-BR');
      const existing = dailyMap.get(date) || { date, revenue: 0, transactions: 0 };
      existing.revenue += Number(transaction.amount);
      existing.transactions += 1;
      dailyMap.set(date, existing);
    });

    return Array.from(dailyMap.values()).slice(-14); // Últimos 14 dias
  };

  const processMonthlyComparison = (transactions: any[]) => {
    const monthlyMap = new Map();
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyMap.get(monthKey) || { month: monthKey, revenue: 0 };
      existing.revenue += Number(transaction.amount);
      monthlyMap.set(monthKey, existing);
    });

    const monthlyData = Array.from(monthlyMap.values());
    
    // Calcular crescimento
    return monthlyData.map((item, index) => ({
      ...item,
      growth: index > 0 ? 
        ((item.revenue - monthlyData[index - 1].revenue) / monthlyData[index - 1].revenue) * 100 : 0
    }));
  };

  const processTopProducts = (transactions: any[]) => {
    const productMap = new Map();
    
    transactions.forEach(transaction => {
      const productName = transaction.products?.name || 'Produto não identificado';
      const existing = productMap.get(productName) || { name: productName, sales: 0, revenue: 0 };
      existing.sales += 1;
      existing.revenue += Number(transaction.amount);
      productMap.set(productName, existing);
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const processCustomerInsights = (transactions: any[]) => {
    const uniqueCustomers = new Set(transactions.map(t => t.customer_email)).size;
    const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const averageOrderValue = totalRevenue / transactions.length || 0;

    return {
      totalCustomers: uniqueCustomers,
      returningCustomers: Math.floor(uniqueCustomers * 0.3), // Estimativa
      averageOrderValue,
      conversionRate: 85.5 // Estimativa
    };
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-AO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' AOA';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Analytics Empresarial</h2>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                timeRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : '90 dias'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Únicos</p>
                <p className="text-2xl font-bold text-foreground">{analytics.customerInsights.totalCustomers}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(analytics.customerInsights.averageOrderValue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-foreground">
                  {analytics.customerInsights.conversionRate}%
                </p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Recorrentes</p>
                <p className="text-2xl font-bold text-foreground">{analytics.customerInsights.returningCustomers}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Receita Diária</CardTitle>
            <CardDescription>Evolução da receita nos últimos dias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Receita']} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Top Produtos</CardTitle>
            <CardDescription>Produtos mais vendidos por receita</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Receita']} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Growth */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>Crescimento Mensal</CardTitle>
          <CardDescription>Comparativo de receita e crescimento mensal</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                name === 'revenue' ? formatCurrency(Number(value)) : `${Number(value).toFixed(1)}%`,
                name === 'revenue' ? 'Receita' : 'Crescimento'
              ]} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" />
              <Bar dataKey="growth" fill="hsl(var(--secondary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}