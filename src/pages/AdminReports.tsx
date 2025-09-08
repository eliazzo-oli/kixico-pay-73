import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminSidebar } from '@/components/AdminSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { NotificationCenter } from '@/components/NotificationCenter';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import kixicoPayLogo from "/lovable-uploads/aaa7ebd4-937a-41c9-ab8e-25102e62b1ed.png";

interface ChartData {
  month: string;
  vendas: number;
  receita: number;
  usuarios: number;
}

export default function AdminReports() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();

  useEffect(() => {
    async function fetchReportsData() {
      try {
        // Get transactions data for the last 12 months
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount, created_at, status')
          .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

        // Get users data for the last 12 months
        const { data: profiles } = await supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

        // Process data by month
        const monthData: { [key: string]: ChartData } = {};
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        
        // Initialize all months
        for (let i = 0; i < 12; i++) {
          const date = new Date();
          date.setMonth(date.getMonth() - (11 - i));
          const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
          monthData[monthKey] = {
            month: months[date.getMonth()],
            vendas: 0,
            receita: 0,
            usuarios: 0
          };
        }

        // Process transactions
        transactions?.forEach(transaction => {
          const date = new Date(transaction.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
          
          if (monthData[monthKey]) {
            if (transaction.status === 'completed') {
              monthData[monthKey].vendas += 1;
              monthData[monthKey].receita += Number(transaction.amount);
            }
          }
        });

        // Process new users
        profiles?.forEach(profile => {
          const date = new Date(profile.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
          
          if (monthData[monthKey]) {
            monthData[monthKey].usuarios += 1;
          }
        });

        const chartArray = Object.values(monthData);
        setChartData(chartArray);
      } catch (error) {
        console.error('Error fetching reports data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReportsData();
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <img 
                  src={kixicoPayLogo} 
                  alt="KixicoPay" 
                  className="h-8 w-auto"
                />
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Relatórios e Análises</h1>
                  <p className="text-sm text-muted-foreground">Gráficos de crescimento e análises da plataforma</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <NotificationCenter />
                <UserAvatar 
                  userId={user?.id || ''} 
                  userEmail={user?.email || ''} 
                  onSignOut={signOut} 
                />
              </div>
            </div>
          </header>

          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Relatórios</h2>
                <p className="text-muted-foreground">
                  Análise de crescimento e performance da plataforma KixicoPay
                </p>
              </div>

              {/* Revenue and Sales Chart */}
              <Card className="border-border/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-foreground">Crescimento de Vendas e Receita</CardTitle>
                  <CardDescription>
                    Evolução das vendas e receita nos últimos 12 meses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-[400px] flex items-center justify-center">
                      <p className="text-muted-foreground">Carregando dados...</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="month" 
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
                        />
                        <Line 
                          type="monotone" 
                          dataKey="receita" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          name="Receita (AOA)"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="vendas" 
                          stroke="hsl(var(--secondary))" 
                          strokeWidth={3}
                          name="Vendas"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* User Growth Chart */}
              <Card className="border-border/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-foreground">Crescimento de Usuários</CardTitle>
                  <CardDescription>
                    Novos usuários registrados por mês
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-muted-foreground">Carregando dados...</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="month" 
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
                        />
                        <Bar 
                          dataKey="usuarios" 
                          fill="hsl(var(--accent))" 
                          name="Novos Usuários"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Total de Vendas (12 meses)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {chartData.reduce((sum, month) => sum + month.vendas, 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">vendas processadas</p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Receita Total (12 meses)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {chartData.reduce((sum, month) => sum + month.receita, 0).toLocaleString('pt-AO')} AOA
                    </div>
                    <p className="text-sm text-muted-foreground">volume transacionado</p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Novos Usuários (12 meses)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {chartData.reduce((sum, month) => sum + month.usuarios, 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">usuários registrados</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}