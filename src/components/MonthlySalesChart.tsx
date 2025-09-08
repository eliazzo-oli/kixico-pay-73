import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface MonthlyData {
  month: string;
  vendas: number;
  receitaLiquida: number;
  crescimento: number;
}

const chartConfig = {
  vendas: {
    label: "Total de Vendas",
    color: "hsl(var(--primary))",
  },
  receitaLiquida: {
    label: "Receita Líquida",
    color: "hsl(var(--secondary))",
  },
};

export function MonthlySalesChart() {
  const { user } = useAuth();
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  useEffect(() => {
    if (user) {
      fetchMonthlyData();
    }
  }, [user]);

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      
      // Get last 12 months
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 11);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, status, created_at')
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process data by month
      const monthlyMap = new Map<string, { vendas: number; receitaLiquida: number }>();
      
      // Initialize all months
      const monthNames = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ];

      for (let i = 0; i < 12; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
        
        monthlyMap.set(monthKey, { vendas: 0, receitaLiquida: 0 });
      }

      // Aggregate transaction data
      transactions?.forEach(transaction => {
        const date = new Date(transaction.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyMap.has(monthKey)) {
          const existing = monthlyMap.get(monthKey)!;
          existing.vendas += 1;
          existing.receitaLiquida += Number(transaction.amount);
        }
      });

      // Convert to chart data with growth calculation
      const chartData: MonthlyData[] = [];
      const monthKeys = Array.from(monthlyMap.keys()).sort();
      
      monthKeys.forEach((monthKey, index) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const monthLabel = `${monthNames[date.getMonth()]} ${year.slice(-2)}`;
        const data = monthlyMap.get(monthKey)!;
        
        // Calculate growth compared to previous month
        let crescimento = 0;
        if (index > 0) {
          const previousKey = monthKeys[index - 1];
          const previousData = monthlyMap.get(previousKey)!;
          if (previousData.receitaLiquida > 0) {
            crescimento = ((data.receitaLiquida - previousData.receitaLiquida) / previousData.receitaLiquida) * 100;
          }
        }
        
        chartData.push({
          month: monthLabel,
          vendas: data.vendas,
          receitaLiquida: data.receitaLiquida,
          crescimento
        });
      });

      setData(chartData);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString('pt-AO')} AOA`;
  };

  const totalSales = data.reduce((sum, item) => sum + item.vendas, 0);
  const totalRevenue = data.reduce((sum, item) => sum + item.receitaLiquida, 0);
  const averageGrowth = data.length > 1 
    ? data.slice(1).reduce((sum, item) => sum + item.crescimento, 0) / (data.length - 1)
    : 0;

  if (loading) {
    return (
      <Card className="border-border/50 shadow-lg">
        <CardContent className="p-6">
          <div className="h-80 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Vendas e Receita por Mês
            </CardTitle>
            <CardDescription>
              Últimos 12 meses • {totalSales} vendas • {formatCurrency(totalRevenue)}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
            >
              Barras
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
            >
              Linha
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis 
                  dataKey="month" 
                  className="text-muted-foreground text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="vendas"
                  orientation="left"
                  className="text-muted-foreground text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="receita"
                  orientation="right"
                  className="text-muted-foreground text-xs"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <ChartTooltip 
                  content={
                    <ChartTooltipContent 
                      formatter={(value, name) => [
                        name === 'vendas' ? `${value} vendas` : formatCurrency(Number(value)),
                        name === 'vendas' ? 'Vendas' : 'Receita Líquida'
                      ]}
                    />
                  }
                />
                <Bar 
                  yAxisId="vendas"
                  dataKey="vendas" 
                  fill="var(--color-vendas)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  yAxisId="receita"
                  dataKey="receitaLiquida" 
                  fill="var(--color-receitaLiquida)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis 
                  dataKey="month" 
                  className="text-muted-foreground text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="vendas"
                  orientation="left"
                  className="text-muted-foreground text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="receita"
                  orientation="right"
                  className="text-muted-foreground text-xs"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <ChartTooltip 
                  content={
                    <ChartTooltipContent 
                      formatter={(value, name) => [
                        name === 'vendas' ? `${value} vendas` : formatCurrency(Number(value)),
                        name === 'vendas' ? 'Vendas' : 'Receita Líquida'
                      ]}
                    />
                  }
                />
                <Line 
                  yAxisId="vendas"
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="var(--color-vendas)"
                  strokeWidth={3}
                  dot={{ fill: "var(--color-vendas)", strokeWidth: 2, r: 4 }}
                />
                <Line 
                  yAxisId="receita"
                  type="monotone" 
                  dataKey="receitaLiquida" 
                  stroke="var(--color-receitaLiquida)"
                  strokeWidth={3}
                  dot={{ fill: "var(--color-receitaLiquida)", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Growth indicator */}
        {averageGrowth !== 0 && (
          <div className="flex items-center justify-center mt-4 p-3 bg-muted/30 rounded-lg">
            <TrendingUp className={`h-4 w-4 mr-2 ${averageGrowth > 0 ? 'text-green-600' : 'text-red-600'}`} />
            <span className="text-sm text-muted-foreground">
              Crescimento médio: 
              <span className={`ml-1 font-semibold ${averageGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {averageGrowth > 0 ? '+' : ''}{averageGrowth.toFixed(1)}%
              </span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}