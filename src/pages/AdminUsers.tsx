import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminSidebar } from '@/components/AdminSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, UserPlus, MoreHorizontal, Users, Edit, UserX, UserCheck, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NotificationCenter } from '@/components/NotificationCenter';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeOnlineCount } from '@/hooks/useRealtimeOnlineCount';
import kixicoPayLogo from "/lovable-uploads/aaa7ebd4-937a-41c9-ab8e-25102e62b1ed.png";

interface UserData {
  id: string;
  name: string;
  email: string;
  balance: number;
  created_at: string;
  plan_name?: string;
  role?: string;
  status?: string;
  subscription_status?: 'active' | 'expired' | 'trial_expired' | 'none';
  subscription_expiry?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  max_products: number;
  features: string[];
}

interface NewUserFormData {
  name: string;
  email: string;
  password: string;
  planId?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState<NewUserFormData>({
    name: '',
    email: '',
    password: '',
    planId: 'no-plan'
  });
  const { user, signOut } = useAuth();
  const { onlineCount } = useRealtimeOnlineCount();
  const navigate = useNavigate();

  // Function to calculate real-time balance for a user
  const calculateUserBalance = async (userId: string): Promise<number> => {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('amount, payment_method, product_id')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (error) {
      console.error('Erro ao buscar transações para usuário:', userId, error);
      return 0;
    }

    let calculatedBalance = 0;
    
    transactions?.forEach(transaction => {
      // Add sales (transactions with product_id and positive amount)
      if (transaction.product_id && transaction.amount > 0) {
        calculatedBalance += Number(transaction.amount);
      }
      // Add manual credit adjustments
      else if (transaction.payment_method === 'credito') {
        calculatedBalance += Number(transaction.amount);
      }
      // Subtract withdrawals and manual debit adjustments
      else if (transaction.payment_method === 'saque' || transaction.payment_method === 'debito') {
        calculatedBalance -= Math.abs(Number(transaction.amount));
      }
    });

    return Math.max(0, calculatedBalance); // Ensure non-negative balance
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch users with their profiles and subscriptions
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*');

        if (error) throw error;

        // Fetch user subscriptions separately
        const { data: subscriptions } = await supabase
          .from('user_subscriptions')
          .select(`
            user_id,
            status,
            expires_at,
            plans (name)
          `)
          .eq('status', 'active');

        // Fetch user roles separately
        const { data: roles } = await supabase
          .from('user_roles')
          .select('user_id, role');

        // Fetch plans for reference
        const { data: plansData } = await supabase
          .from('plans')
          .select('*')
          .eq('is_active', true);

        // Calculate real-time balances for all users
        const userDataWithBalances = await Promise.all(
          profiles?.map(async (profile) => {
            const realTimeBalance = await calculateUserBalance(profile.user_id);
            const userSubscription = subscriptions?.find(sub => sub.user_id === profile.user_id);
            const userRole = roles?.find(role => role.user_id === profile.user_id);
            
            // Determinar o plano do usuário: 
            // 1. Se tem assinatura ativa, usar o plano da assinatura
            // 2. Se não tem assinatura ativa, usar o plano_assinatura do perfil  
            // 3. Se não tem nenhum, mostrar o plano básico padrão ou "Sem plano"
            let planName = 'Sem plano';
            let subscriptionStatus: 'active' | 'expired' | 'trial_expired' | 'none' = 'none';
            let subscriptionExpiry: string | undefined;
            
            // Verificar status do trial
            const now = new Date();
            let isTrialExpired = false;
            if (profile.trial_end_date) {
              const trialEndDate = new Date(profile.trial_end_date);
              isTrialExpired = now > trialEndDate;
            }
            
            if (userSubscription?.plans) {
              // Usuário tem assinatura ativa - verificar se está expirada
              planName = (userSubscription.plans as any).name;
              if (userSubscription.expires_at) {
                const expiryDate = new Date(userSubscription.expires_at);
                subscriptionExpiry = userSubscription.expires_at;
                subscriptionStatus = now <= expiryDate ? 'active' : 'expired';
              } else {
                subscriptionStatus = 'active';
              }
            } else if (profile.plano_assinatura && profile.plano_assinatura !== 'basico') {
              // Usuário tem plano definido no perfil (diferente do básico padrão)
              const planDisplayNames: Record<string, string> = {
                'basico': 'Básico',
                'profissional': 'Profissional', 
                'empresarial': 'Empresarial'
              };
              planName = planDisplayNames[profile.plano_assinatura] || profile.plano_assinatura;
              subscriptionStatus = isTrialExpired ? 'trial_expired' : 'active';
            } else if (profile.plano_assinatura === 'basico') {
              // Usuário tem plano básico
              planName = 'Básico';
              subscriptionStatus = isTrialExpired ? 'trial_expired' : 'active';
            } else {
              // Sem plano
              subscriptionStatus = isTrialExpired ? 'trial_expired' : 'none';
            }
            
            return {
              id: profile.user_id,
              name: profile.name,
              email: profile.email,
              balance: realTimeBalance, // Use calculated real-time balance
              created_at: profile.created_at,
              plan_name: planName,
              role: userRole?.role || 'user',
              status: profile.status || 'active',
              subscription_status: subscriptionStatus,
              subscription_expiry: subscriptionExpiry
            };
          }) || []
        );

        const userData = userDataWithBalances;

        setUsers(userData);
        setPlans(plansData || []);
        setTotalUsers(userData.length);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Set up realtime subscription for all user changes
    const channel = supabase
      .channel('admin-users-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, async (payload) => {
        console.log('New user registered:', payload);
        const newProfile = payload.new as any;
        
        // Determinar o plano do novo usuário
        let planName = 'Sem plano';
        if (newProfile.plano_assinatura && newProfile.plano_assinatura !== 'basico') {
          const planDisplayNames: Record<string, string> = {
            'basico': 'Básico',
            'profissional': 'Profissional', 
            'empresarial': 'Empresarial'
          };
          planName = planDisplayNames[newProfile.plano_assinatura] || newProfile.plano_assinatura;
        } else if (newProfile.plano_assinatura === 'basico') {
          planName = 'Básico';
        }

        const newUser: UserData = {
          id: newProfile.user_id,
          name: newProfile.name,
          email: newProfile.email,
          balance: await calculateUserBalance(newProfile.user_id), // Calculate real-time balance
          created_at: newProfile.created_at,
          plan_name: planName,
          role: 'user',
          status: newProfile.status || 'active'
        };

        setUsers(prevUsers => [...prevUsers, newUser]);
        setTotalUsers(prev => prev + 1);
        
        toast.success(`Novo usuário registrado: ${newProfile.name}`, {
          description: `E-mail: ${newProfile.email}`
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, async (payload) => {
        console.log('User updated:', payload);
        const updatedProfile = payload.new as any;
        const recalculatedBalance = await calculateUserBalance(updatedProfile.user_id);
        
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === updatedProfile.user_id
              ? { ...user, name: updatedProfile.name, email: updatedProfile.email, balance: recalculatedBalance, status: updatedProfile.status || 'active' }
              : user
          )
        );
        
        toast.info(`Usuário atualizado: ${updatedProfile.name}`);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_subscriptions' }, async (payload) => {
        console.log('User subscription changed:', payload);
        // Refresh user data to get updated plan information
        try {
          const { data: profiles, error } = await supabase.from('profiles').select('*');
          if (error) throw error;

          const { data: subscriptions } = await supabase.from('user_subscriptions').select(`user_id, status, plans (name)`).eq('status', 'active');
          const { data: roles } = await supabase.from('user_roles').select('user_id, role');

          const userDataWithBalances = await Promise.all(
            profiles?.map(async (profile) => {
              const realTimeBalance = await calculateUserBalance(profile.user_id);
              const userSubscription = subscriptions?.find(sub => sub.user_id === profile.user_id);
              const userRole = roles?.find(role => role.user_id === profile.user_id);
              
              // Determinar o plano do usuário corretamente
              let planName = 'Sem plano';
              
              if (userSubscription?.plans) {
                // Usuário tem assinatura ativa
                planName = (userSubscription.plans as any).name;
              } else if (profile.plano_assinatura && profile.plano_assinatura !== 'basico') {
                // Usuário tem plano definido no perfil (diferente do básico padrão)
                const planDisplayNames: Record<string, string> = {
                  'basico': 'Básico',
                  'profissional': 'Profissional', 
                  'empresarial': 'Empresarial'
                };
                planName = planDisplayNames[profile.plano_assinatura] || profile.plano_assinatura;
              } else if (profile.plano_assinatura === 'basico') {
                // Usuário tem plano básico
                planName = 'Básico';
              }
              
              return {
                id: profile.user_id,
                name: profile.name,
                email: profile.email,
                balance: realTimeBalance, // Use calculated real-time balance
                created_at: profile.created_at,
                plan_name: planName,
                role: userRole?.role || 'user',
                status: profile.status || 'active'
              };
            }) || []
          );

          const userData = userDataWithBalances;

          setUsers(userData);
          
          if (payload.eventType === 'INSERT') {
            toast.success('Nova assinatura criada', { description: 'Os dados dos usuários foram atualizados' });
          } else if (payload.eventType === 'UPDATE') {
            toast.info('Assinatura atualizada', { description: 'Os dados dos usuários foram atualizados' });
          }
        } catch (error) {
          console.error('Error refreshing users after subscription change:', error);
        }
      })
      // Add listener for transaction changes to recalculate balances
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, async (payload) => {
        console.log('Transaction changed:', payload);
        try {
          // Recalculate balance for the affected user
          const transaction = payload.new as any;
          if (transaction?.user_id) {
            const updatedBalance = await calculateUserBalance(transaction.user_id);
            
            setUsers(prevUsers => 
              prevUsers.map(user => 
                user.id === transaction.user_id 
                  ? { ...user, balance: updatedBalance }
                  : user
              )
            );
          }
        } catch (error) {
          console.error('Error updating user balance after transaction change:', error);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && (user.status === 'active' || user.status === 'online')) ||
      (statusFilter === 'online' && user.status === 'online') ||
      (statusFilter === 'suspended' && user.status === 'suspended');
    
    return matchesSearch && matchesStatus;
  });

  const getUsersByPlan = (planName: string) => {
    return filteredUsers.filter(user => user.plan_name === planName);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'suspended') {
      return <Badge variant="destructive">Suspenso</Badge>;
    }
    if (status === 'online') {
      return <Badge className="bg-success/10 text-success border-success/20">Online</Badge>;
    }
    return <Badge variant="outline">Ativo</Badge>;
  };

  const getSubscriptionStatusBadge = (subscriptionStatus: 'active' | 'expired' | 'trial_expired' | 'none', expiry?: string) => {
    switch (subscriptionStatus) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/20">Ativo {expiry && `(${new Date(expiry).toLocaleDateString('pt-AO')})`}</Badge>;
      case 'expired':
        return <Badge variant="destructive">Plano Expirado</Badge>;
      case 'trial_expired':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Trial Expirado</Badge>;
      default:
        return <Badge variant="secondary">Sem Plano</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return <Badge variant="destructive">Admin</Badge>;
    }
    return <Badge variant="secondary">Usuário</Badge>;
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, status: newStatus } : user
        )
      );

      toast.success(
        newStatus === 'suspended' 
          ? 'Usuário suspenso com sucesso' 
          : 'Usuário reativado com sucesso'
      );
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast.error('Erro ao atualizar status do usuário');
    }
  };

  const handleAddUser = async () => {
    if (!newUserForm.name || !newUserForm.email || !newUserForm.password) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsAddingUser(true);
    try {
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserForm.email,
        password: newUserForm.password,
        user_metadata: { name: newUserForm.name }
      });

      if (authError) throw authError;

      // If a plan is selected (and not "no-plan"), create subscription
      if (newUserForm.planId && newUserForm.planId !== 'no-plan' && authData.user) {
        const { error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: authData.user.id,
            plan_id: newUserForm.planId,
            status: 'active'
          });

        if (subscriptionError) {
          console.error('Error creating subscription:', subscriptionError);
        }
      }

      toast.success('Usuário criado com sucesso!');
      setIsAddUserModalOpen(false);
      setNewUserForm({ name: '', email: '', password: '', planId: 'no-plan' });
      
      // Refresh data
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Erro ao criar usuário');
    } finally {
      setIsAddingUser(false);
    }
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
                <img src={kixicoPayLogo} alt="KixicoPay" className="h-8 w-auto" />
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Gestão de Usuários</h1>
                  <p className="text-sm text-muted-foreground">Gerenciar todos os usuários da plataforma</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <NotificationCenter />
                <UserAvatar userId={user?.id || ''} userEmail={user?.email || ''} onSignOut={signOut} />
              </div>
            </div>
          </header>

          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Stats Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card className="border-border/50 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
                        <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-success/10 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse"></div>
                          <Users className="h-6 w-6 text-success" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Usuários Online</p>
                        <p className="text-2xl font-bold text-foreground">{onlineCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border/50 shadow-lg">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-foreground">Usuários Registrados</CardTitle>
                      <CardDescription>Lista completa de todos os usuários da plataforma</CardDescription>
                    </div>
                    <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
                      <DialogTrigger asChild>
                        <Button className="shrink-0">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Adicionar Usuário
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                          <DialogDescription>Crie uma nova conta de usuário na plataforma.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Nome</Label>
                            <Input id="name" value={newUserForm.name} onChange={(e) => setNewUserForm(prev => ({ ...prev, name: e.target.value }))} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">E-mail</Label>
                            <Input id="email" type="email" value={newUserForm.email} onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right">Senha</Label>
                            <Input id="password" type="password" value={newUserForm.password} onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="plan" className="text-right">Plano</Label>
                            <Select value={newUserForm.planId} onValueChange={(value) => setNewUserForm(prev => ({ ...prev, planId: value }))}>
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecionar plano (opcional)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="no-plan">Sem plano</SelectItem>
                                {plans.map((plan) => (
                                  <SelectItem key={plan.id} value={plan.id}>{plan.name} - {plan.price.toLocaleString('pt-AO')} AOA</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" onClick={handleAddUser} disabled={isAddingUser}>
                            {isAddingUser ? 'Criando...' : 'Criar Usuário'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Buscar usuários..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Ativos</SelectItem>
                        <SelectItem value="online">Online agora</SelectItem>
                        <SelectItem value="suspended">Suspensos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-7">
                      <TabsTrigger value="all">Todos ({filteredUsers.length})</TabsTrigger>
                      <TabsTrigger value="suspended" className="text-destructive">
                        <UserX className="h-4 w-4 mr-1" />
                        Suspensos ({users.filter(u => u.status === 'suspended').length})
                      </TabsTrigger>
                      <TabsTrigger value="trial-expired" className="text-warning">
                        Trial Expirado ({users.filter(u => u.subscription_status === 'trial_expired').length})
                      </TabsTrigger>
                      <TabsTrigger value="sem-plano">Sem Plano ({getUsersByPlan('Sem plano').length})</TabsTrigger>
                      {plans.map((plan) => (
                        <TabsTrigger key={plan.id} value={plan.name.toLowerCase()}>
                          {plan.name} ({getUsersByPlan(plan.name).length})
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    <TabsContent value="all" className="mt-6">
                      <div className="rounded-md border border-border/50">
                        <Table>
                           <TableHeader>
                             <TableRow>
                               <TableHead>Nome</TableHead>
                               <TableHead>E-mail</TableHead>
                               <TableHead>Plano</TableHead>
                               <TableHead>Status Assinatura</TableHead>
                               <TableHead>Saldo</TableHead>
                               <TableHead>Status</TableHead>
                               <TableHead>Função</TableHead>
                               <TableHead>Data de Cadastro</TableHead>
                               <TableHead className="w-[120px]">Ações</TableHead>
                             </TableRow>
                           </TableHeader>
                          <TableBody>
                            {loading ? (
                              <TableRow>
                                 <TableCell colSpan={9} className="text-center py-8">Carregando usuários...</TableCell>
                              </TableRow>
                            ) : filteredUsers.length === 0 ? (
                              <TableRow>
                                 <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                  {searchTerm ? 'Nenhum usuário encontrado.' : 'Nenhum usuário registrado ainda.'}
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredUsers.map((user) => (
                                 <TableRow key={user.id}>
                                   <TableCell className="font-medium">{user.name}</TableCell>
                                   <TableCell>{user.email}</TableCell>
                                   <TableCell>{user.plan_name}</TableCell>
                                   <TableCell>{getSubscriptionStatusBadge(user.subscription_status || 'none', user.subscription_expiry)}</TableCell>
                                   <TableCell>{user.balance.toLocaleString('pt-AO')} AOA</TableCell>
                                   <TableCell>{getStatusBadge(user.status || 'active')}</TableCell>
                                   <TableCell>{getRoleBadge(user.role || 'user')}</TableCell>
                                   <TableCell>{new Date(user.created_at).toLocaleDateString('pt-AO')}</TableCell>
                                   <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/users/${user.id}`)}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleToggleUserStatus(user.id, user.status || 'active')}
                                        className={user.status === 'suspended' ? 'text-success hover:text-success' : 'text-destructive hover:text-destructive'}
                                        title={user.status === 'suspended' ? 'Reativar usuário' : 'Suspender usuário'}
                                      >
                                        {user.status === 'suspended' ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    <TabsContent value="trial-expired" className="mt-6">
                      <div className="mb-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-5 w-5 text-warning" />
                          <h3 className="font-semibold text-lg text-warning">Usuários com Trial Expirado</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Usuários cujo período de avaliação gratuita expirou e não renovaram a assinatura.
                        </p>
                      </div>
                      <div className="rounded-md border border-border/50">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>E-mail</TableHead>
                              <TableHead>Plano</TableHead>
                              <TableHead>Saldo</TableHead>
                              <TableHead>Data de Cadastro</TableHead>
                              <TableHead className="w-[120px]">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {users.filter(u => u.subscription_status === 'trial_expired').length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                  Nenhum usuário com trial expirado.
                                </TableCell>
                              </TableRow>
                            ) : (
                              users.filter(u => u.subscription_status === 'trial_expired').map((user) => (
                                <TableRow key={user.id}>
                                  <TableCell className="font-medium">{user.name}</TableCell>
                                  <TableCell>{user.email}</TableCell>
                                  <TableCell>{user.plan_name}</TableCell>
                                  <TableCell>{user.balance.toLocaleString('pt-AO')} AOA</TableCell>
                                  <TableCell>{new Date(user.created_at).toLocaleDateString('pt-AO')}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/users/${user.id}`)}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleToggleUserStatus(user.id, user.status || 'active')}
                                        className={user.status === 'suspended' ? 'text-success hover:text-success' : 'text-destructive hover:text-destructive'}
                                        title={user.status === 'suspended' ? 'Reativar usuário' : 'Suspender usuário'}
                                      >
                                        {user.status === 'suspended' ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    <TabsContent value="suspended" className="mt-6">
                      <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-5 w-5 text-destructive" />
                          <h3 className="font-semibold text-lg text-destructive">Usuários Suspensos</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Usuários suspensos não podem acessar a plataforma. Use o botão de reativar para permitir o acesso novamente.
                        </p>
                      </div>
                      <div className="rounded-md border border-border/50">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>E-mail</TableHead>
                              <TableHead>Plano</TableHead>
                              <TableHead>Saldo</TableHead>
                              <TableHead>Data de Cadastro</TableHead>
                              <TableHead className="w-[120px]">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {users.filter(u => u.status === 'suspended').length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                  Nenhum usuário suspenso.
                                </TableCell>
                              </TableRow>
                            ) : (
                              users.filter(u => u.status === 'suspended').map((user) => (
                                <TableRow key={user.id}>
                                  <TableCell className="font-medium">{user.name}</TableCell>
                                  <TableCell>{user.email}</TableCell>
                                  <TableCell>{user.plan_name}</TableCell>
                                  <TableCell>{user.balance.toLocaleString('pt-AO')} AOA</TableCell>
                                  <TableCell>{new Date(user.created_at).toLocaleDateString('pt-AO')}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/users/${user.id}`)}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleToggleUserStatus(user.id, user.status || 'active')}
                                        className="text-success hover:text-success"
                                        title="Reativar usuário"
                                      >
                                        <UserCheck className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    <TabsContent value="sem-plano" className="mt-6">
                      <div className="rounded-md border border-border/50">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>E-mail</TableHead>
                              <TableHead>Saldo</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Função</TableHead>
                              <TableHead>Data de Cadastro</TableHead>
                              <TableHead className="w-[120px]">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getUsersByPlan('Sem plano').map((user) => (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.balance.toLocaleString('pt-AO')} AOA</TableCell>
                                <TableCell>{getStatusBadge(user.status || 'active')}</TableCell>
                                <TableCell>{getRoleBadge(user.role || 'user')}</TableCell>
                                <TableCell>{new Date(user.created_at).toLocaleDateString('pt-AO')}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/users/${user.id}`)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleToggleUserStatus(user.id, user.status || 'active')}
                                      className={user.status === 'suspended' ? 'text-success hover:text-success' : 'text-destructive hover:text-destructive'}
                                      title={user.status === 'suspended' ? 'Reativar usuário' : 'Suspender usuário'}
                                    >
                                      {user.status === 'suspended' ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    {plans.map((plan) => (
                      <TabsContent key={plan.id} value={plan.name.toLowerCase()} className="mt-6">
                        <div className="rounded-md border border-border/50">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>E-mail</TableHead>
                                <TableHead>Saldo</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Função</TableHead>
                                <TableHead>Data de Cadastro</TableHead>
                                <TableHead className="w-[120px]">Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {getUsersByPlan(plan.name).map((user) => (
                                <TableRow key={user.id}>
                                  <TableCell className="font-medium">{user.name}</TableCell>
                                  <TableCell>{user.email}</TableCell>
                                  <TableCell>{user.balance.toLocaleString('pt-AO')} AOA</TableCell>
                                  <TableCell>{getStatusBadge(user.status || 'active')}</TableCell>
                                  <TableCell>{getRoleBadge(user.role || 'user')}</TableCell>
                                  <TableCell>{new Date(user.created_at).toLocaleDateString('pt-AO')}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/users/${user.id}`)}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleToggleUserStatus(user.id, user.status || 'active')}
                                        className={user.status === 'suspended' ? 'text-success hover:text-success' : 'text-destructive hover:text-destructive'}
                                        title={user.status === 'suspended' ? 'Reativar usuário' : 'Suspender usuário'}
                                      >
                                        {user.status === 'suspended' ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>

                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {filteredUsers.length} de {users.length} usuários
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}