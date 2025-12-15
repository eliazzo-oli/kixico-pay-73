
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminSidebar } from '@/components/AdminSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Crown, TrendingUp, Users, Eye, DollarSign, ShoppingCart, Radio } from 'lucide-react';
import { NotificationCenter } from '@/components/NotificationCenter';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuth } from '@/hooks/useAuth';

import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import kixicoPayLogo from "/lovable-uploads/aaa7ebd4-937a-41c9-ab8e-25102e62b1ed.png";

interface UserAnalytics {
  user_id: string;
  name: string;
  email: string;
  balance: number;
  total_sales: number;
  total_revenue: number;
  total_transactions: number;
  created_at: string;
  last_transaction: string;
  plano_assinatura: string;
  active_products: number;
  status: string;
}

interface TopUser {
  user_id: string;
  name: string;
  email: string;
  metric_value: number;
  metric_label: string;
}

export default function AdminUserAnalytics() {
  const [users, setUsers] = useState<UserAnalytics[]>([]);
  const [topUsers, setTopUsers] = useState<{
    bySales: TopUser[];
    byRevenue: TopUser[];
    byTransactions: TopUser[];
  }>({
    bySales: [],
    byRevenue: [],
    byTransactions: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const { user, signOut } = useAuth();
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserAnalytics();
    
    // Set up real-time updates for transactions and profiles
    const transactionsChannel = supabase
      .channel('transactions_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions' }, 
        () => {
          console.log('Transaction change detected, refreshing data...');
          fetchUserAnalytics();
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel('profiles_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' }, 
        () => {
          console.log('Profile change detected, refreshing data...');
          fetchUserAnalytics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  const fetchUserAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch all user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch transactions data
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('user_id, amount, status, created_at');

      if (transactionsError) throw transactionsError;

      // Fetch products data
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('user_id, active');

      if (productsError) throw productsError;

      // Process user analytics
      const userAnalytics = profiles?.map(profile => {
        const userTransactions = transactions?.filter(t => t.user_id === profile.user_id && t.status === 'completed') || [];
        const userProducts = products?.filter(p => p.user_id === profile.user_id && p.active) || [];
        
        const totalRevenue = userTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const totalSales = userTransactions.length;
        const totalTransactions = transactions?.filter(t => t.user_id === profile.user_id).length || 0;
        const lastTransaction = userTransactions.length > 0 ? 
          Math.max(...userTransactions.map(t => new Date(t.created_at).getTime())) : 0;

        return {
          user_id: profile.user_id,
          name: profile.name,
          email: profile.email,
          balance: 0, // Balance calculado dinamicamente
          total_sales: totalSales,
          total_revenue: totalRevenue,
          total_transactions: totalTransactions,
          created_at: profile.created_at,
          last_transaction: lastTransaction > 0 ? new Date(lastTransaction).toISOString() : '',
          plano_assinatura: 'gratuito', // Plataforma gratuita
          active_products: userProducts.length,
          status: profile.status || 'active'
        };
      }) || [];

      setUsers(userAnalytics);

      // Calculate top users
      const sortedBySales = [...userAnalytics]
        .sort((a, b) => b.total_sales - a.total_sales)
        .slice(0, 5)
        .map(user => ({
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          metric_value: user.total_sales,
          metric_label: 'vendas'
        }));

      const sortedByRevenue = [...userAnalytics]
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 5)
        .map(user => ({
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          metric_value: user.total_revenue,
          metric_label: 'AOA'
        }));

      const sortedByTransactions = [...userAnalytics]
        .sort((a, b) => b.total_transactions - a.total_transactions)
        .slice(0, 5)
        .map(user => ({
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          metric_value: user.total_transactions,
          metric_label: 'transações'
        }));

      setTopUsers({
        bySales: sortedBySales,
        byRevenue: sortedByRevenue,
        byTransactions: sortedByTransactions
      });

    } catch (error) {
      console.error('Error fetching user analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlan = planFilter === 'all' || user.plano_assinatura === planFilter;
    
    const isActive = user.total_transactions > 0 || user.active_products > 0;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'inactive' && !isActive);
    
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'profissional':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Profissional</Badge>;
      case 'empresarial':
        return <Badge className="bg-accent/10 text-accent-foreground border-accent/20">Empresarial</Badge>;
      default:
        return <Badge variant="outline">Básico</Badge>;
    }
  };

  const getStatusBadge = (user: UserAnalytics) => {
    if (user.status === 'suspended') {
      return <Badge variant="destructive">Suspenso</Badge>;
    }
    
    const isActive = user.total_transactions > 0 || user.active_products > 0;
    return isActive ? 
      <Badge className="bg-success/10 text-success border-success/20">Ativo</Badge> :
      <Badge variant="secondary">Inativo</Badge>;
  };

  const handleViewUser = (userId: string) => {
    navigate(`/admin/users/${userId}`);
  };

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
                  <h1 className="text-xl font-semibold text-foreground">Análise de Usuários</h1>
                  <p className="text-sm text-muted-foreground">Estatísticas detalhadas e rankings</p>
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
              <Tabs defaultValue="rankings" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="rankings">Top Usuários</TabsTrigger>
                  <TabsTrigger value="online">Usuários Online</TabsTrigger>
                  <TabsTrigger value="users">Gestão de Usuários</TabsTrigger>
                </TabsList>

                <TabsContent value="rankings" className="space-y-6">
                  {/* Top Users Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="border-border/50 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-foreground">
                          <Crown className="h-5 w-5 text-amber-500" />
                          Top por Vendas
                        </CardTitle>
                        <CardDescription>Usuários com mais vendas realizadas</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <p className="text-muted-foreground">Carregando...</p>
                        ) : (
                          <div className="space-y-3">
                            {topUsers.bySales.slice(0, 3).map((user, index) => (
                              <div key={user.user_id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-primary">#{index + 1}</span>
                                  <div>
                                    <p className="font-medium text-foreground text-sm">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                  </div>
                                </div>
                                <Badge variant="outline">{user.metric_value} {user.metric_label}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-foreground">
                          <DollarSign className="h-5 w-5 text-green-500" />
                          Top por Receita
                        </CardTitle>
                        <CardDescription>Usuários com maior volume financeiro</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <p className="text-muted-foreground">Carregando...</p>
                        ) : (
                          <div className="space-y-3">
                            {topUsers.byRevenue.slice(0, 3).map((user, index) => (
                              <div key={user.user_id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-primary">#{index + 1}</span>
                                  <div>
                                    <p className="font-medium text-foreground text-sm">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                  </div>
                                </div>
                                <Badge variant="outline">{user.metric_value.toLocaleString('pt-AO')} {user.metric_label}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-foreground">
                          <TrendingUp className="h-5 w-5 text-blue-500" />
                          Top por Atividade
                        </CardTitle>
                        <CardDescription>Usuários mais ativos na plataforma</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <p className="text-muted-foreground">Carregando...</p>
                        ) : (
                          <div className="space-y-3">
                            {topUsers.byTransactions.slice(0, 3).map((user, index) => (
                              <div key={user.user_id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-primary">#{index + 1}</span>
                                  <div>
                                    <p className="font-medium text-foreground text-sm">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                  </div>
                                </div>
                                <Badge variant="outline">{user.metric_value} {user.metric_label}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detailed Rankings */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {Object.entries({
                      'Vendas': topUsers.bySales,
                      'Receita': topUsers.byRevenue,
                      'Transações': topUsers.byTransactions
                    }).map(([title, data]) => (
                      <Card key={title} className="border-border/50 shadow-lg">
                        <CardHeader>
                          <CardTitle className="text-foreground">Ranking Completo - {title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {data.map((user, index) => (
                              <div key={user.user_id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-primary w-6">#{index + 1}</span>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-foreground text-sm truncate">{user.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-foreground">
                                    {title === 'Receita' ? 
                                      `${user.metric_value.toLocaleString('pt-AO')} AOA` :
                                      `${user.metric_value} ${user.metric_label}`
                                    }
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="online" className="space-y-6">
                  <Card className="border-border/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <Radio className="h-5 w-5 text-green-500" />
                        Usuários Online em Tempo Real
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 ml-2">
                          {users.filter(u => u.status === 'online').length} online
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Usuários atualmente conectados na plataforma
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {users.filter(u => u.status === 'online').length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Radio className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhum usuário online no momento</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {users.filter(u => u.status === 'online').map((u) => (
                            <div key={u.user_id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg bg-card/50">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <div>
                                  <p className="font-medium text-foreground">{u.name}</p>
                                  <p className="text-sm text-muted-foreground">{u.email}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline" className="mt-1">
                                  Online
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="users" className="space-y-6">
                  <Card className="border-border/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <Users className="h-5 w-5" />
                        Gestão Completa de Usuários
                      </CardTitle>
                      <CardDescription>
                        Visualize todos os usuários com estatísticas detalhadas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1 max-w-sm">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar usuários..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os Status</SelectItem>
                            <SelectItem value="active">Ativos</SelectItem>
                            <SelectItem value="inactive">Inativos</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={planFilter} onValueChange={setPlanFilter}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Plano" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os Planos</SelectItem>
                            <SelectItem value="basico">Básico</SelectItem>
                            <SelectItem value="profissional">Profissional</SelectItem>
                            <SelectItem value="empresarial">Empresarial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="rounded-md border border-border/50 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Usuário</TableHead>
                              <TableHead>E-mail</TableHead>
                              <TableHead>Plano</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Saldo</TableHead>
                              <TableHead>Vendas</TableHead>
                              <TableHead>Receita</TableHead>
                              <TableHead>Produtos</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loading ? (
                              <TableRow>
                                <TableCell colSpan={9} className="text-center py-8">
                                  Carregando usuários...
                                </TableCell>
                              </TableRow>
                            ) : filteredUsers.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                  {searchTerm || statusFilter !== 'all' || planFilter !== 'all' 
                                    ? 'Nenhum usuário encontrado com os filtros aplicados.' 
                                    : 'Nenhum usuário encontrado.'}
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredUsers.map((user) => (
                                <TableRow key={user.user_id}>
                                  <TableCell className="font-medium">{user.name}</TableCell>
                                  <TableCell>{user.email}</TableCell>
                                  <TableCell>{getPlanBadge(user.plano_assinatura)}</TableCell>
                                  <TableCell>{getStatusBadge(user)}</TableCell>
                                  <TableCell className="font-medium">
                                    {user.balance.toLocaleString('pt-AO')} AOA
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                                      {user.total_sales}
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {user.total_revenue.toLocaleString('pt-AO')} AOA
                                  </TableCell>
                                  <TableCell>{user.active_products}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewUser(user.user_id)}
                                      className="flex items-center gap-1"
                                    >
                                      <Eye className="h-3 w-3" />
                                      Ver
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="flex items-center justify-between mt-6">
                        <p className="text-sm text-muted-foreground">
                          Mostrando {filteredUsers.length} de {users.length} usuários
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
