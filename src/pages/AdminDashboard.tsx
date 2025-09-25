import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminSidebar } from '@/components/AdminSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Users, DollarSign, TrendingUp, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SendNotificationForm } from '@/components/SendNotificationForm';
import { NotificationCenter } from '@/components/NotificationCenter';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeOnlineCount } from '@/hooks/useRealtimeOnlineCount';
import kixicoPayLogo from "/lovable-uploads/aaa7ebd4-937a-41c9-ab8e-25102e62b1ed.png";

interface DashboardStats {
  totalUsers: number;
  totalRevenue: number;
  totalTransactions: number;
  platformRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    platformRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const { onlineCount } = useRealtimeOnlineCount();

  // Debug: Log when online count changes
  useEffect(() => {
    console.log('Online count updated (realtime DB):', onlineCount);
  }, [onlineCount]);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch total users
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch total transactions and revenue (only actual sales)
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount, status, product_id, payment_method');

        // Count only real sales (transactions with product_id)
        const salesTransactions = transactions?.filter(t => 
          t.status === 'completed' && t.product_id
        ) || [];
        
        const totalTransactions = salesTransactions.length;
        const totalRevenue = salesTransactions
          ?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        // Calculate platform revenue (assuming 2.5% fee)
        const platformRevenue = totalRevenue * 0.025;

        setStats({
          totalUsers: usersCount || 0,
          totalRevenue,
          totalTransactions,
          platformRevenue,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
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
                  <h1 className="text-xl font-semibold text-foreground">Painel Administrativo</h1>
                  <p className="text-sm text-muted-foreground">Dashboard Geral</p>
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
                <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard Geral</h2>
                <p className="text-muted-foreground">
                  Visão geral das métricas da plataforma KixicoPay
                </p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total de Usuários
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {loading ? '...' : stats.totalUsers.toLocaleString()}
                    </div>
                    <p className="text-xs text-success flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Usuários registrados na plataforma
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Usuários Online
                    </CardTitle>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse"></div>
                      <Users className="h-4 w-4 text-success" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {onlineCount.toLocaleString()}
                    </div>
                    <p className="text-xs text-success flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Usuários ativos agora
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total de Vendas
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {loading ? '...' : `${stats.totalRevenue.toLocaleString('pt-AO')} AOA`}
                    </div>
                    <p className="text-xs text-success flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Volume total transacionado
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total de Vendas (Quantidade)
                    </CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {loading ? '...' : stats.totalTransactions.toLocaleString()}
                    </div>
                    <p className="text-xs text-success flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Vendas efetivas processadas
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Faturamento Líquido
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {loading ? '...' : `${stats.platformRevenue.toLocaleString('pt-AO')} AOA`}
                    </div>
                    <p className="text-xs text-success flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Taxa de 2,5% sobre vendas
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Notification Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SendNotificationForm />

                <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-foreground">Atividade Recente</CardTitle>
                    <CardDescription>
                      Últimas atividades na plataforma
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">Novo usuário registrado</p>
                          <p className="text-xs text-muted-foreground">Há 2 minutos</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">Transação processada</p>
                          <p className="text-xs text-muted-foreground">Há 5 minutos</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">Saque aprovado</p>
                          <p className="text-xs text-muted-foreground">Há 10 minutos</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Status */}
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-foreground">Sistema</CardTitle>
                    <CardDescription>
                      Status e informações do sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Status da API</span>
                        <span className="flex items-center text-success text-sm">
                          <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
                          Online
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Base de Dados</span>
                        <span className="flex items-center text-success text-sm">
                          <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
                          Conectada
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Última Atualização</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date().toLocaleDateString('pt-AO')}
                        </span>
                      </div>
                    </div>
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