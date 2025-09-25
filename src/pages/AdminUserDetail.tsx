import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminSidebar } from '@/components/AdminSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, DollarSign, ShoppingCart, CreditCard, Package, Save, Ban, UserCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NotificationCenter } from '@/components/NotificationCenter';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import kixicoPayLogo from "/lovable-uploads/aaa7ebd4-937a-41c9-ab8e-25102e62b1ed.png";

interface UserDetail {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
  created_at: string;
  plano_assinatura: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  digital_wallet_type: string;
  digital_wallet_identifier: string;
  status: string;
}

interface EditableUserData {
  name: string;
  email: string;
  phone: string;
  plano_assinatura: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  digital_wallet_type: string;
  digital_wallet_identifier: string;
}

interface Transaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  payment_method: string;
  product_name?: string;
  product_id?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  active: boolean;
  created_at: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  bank_name: string;
  account_number: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
}

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [editableData, setEditableData] = useState<EditableUserData>({
    name: '',
    email: '',
    phone: '',
    plano_assinatura: 'basico',
    bank_name: '',
    account_number: '',
    account_holder_name: '',
    digital_wallet_type: '',
    digital_wallet_identifier: '',
  });
  const [calculatedBalance, setCalculatedBalance] = useState<number>(0);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showDebitModal, setShowDebitModal] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({ amount: '', justification: '' });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (id) {
      fetchUserDetail();
      fetchPlans();
    }
  }, [id]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', id)
        .single();

      if (profileError) throw profileError;

      setUserDetail(profile);
      setEditableData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        plano_assinatura: profile.plano_assinatura || 'basico',
        bank_name: profile.bank_name || '',
        account_number: profile.account_number || '',
        account_holder_name: profile.account_holder_name || '',
        digital_wallet_type: profile.digital_wallet_type === 'none' ? '' : profile.digital_wallet_type || '',
        digital_wallet_identifier: profile.digital_wallet_identifier || '',
      });

      // Calculate balance from transactions
      await calculateUserBalance(id);

      // Fetch user transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select(`
          *,
          products(name)
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (transactionError) throw transactionError;

      const formattedTransactions = transactionData?.map(t => ({
        id: t.id,
        amount: Number(t.amount),
        status: t.status,
        created_at: t.created_at,
        customer_name: t.customer_name || 'N/A',
        customer_email: t.customer_email,
        payment_method: t.payment_method || 'N/A',
        product_name: t.products?.name,
        product_id: t.product_id
      })) || [];

      setTransactions(formattedTransactions);

      // Fetch user products
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (productError) throw productError;
      setProducts(productData || []);

      // Fetch user withdrawals
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (withdrawalError) throw withdrawalError;
      setWithdrawals(withdrawalData || []);

    } catch (error) {
      console.error('Error fetching user detail:', error);
      toast.error('Erro ao carregar dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  const calculateUserBalance = async (userId: string) => {
    try {
      const { data: transactionData, error } = await supabase
        .from('transactions')
        .select('amount, status, payment_method, product_id')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (error) throw error;

      // Calculate balance using the correct formula:
      // Saldo = (Soma de todas as Vendas + Ajustes de Crédito) - (Saques Aprovados + Ajustes de Débito)
      let balance = 0;

      transactionData?.forEach(transaction => {
        // Add sales (transactions with product_id and positive amount)
        if (transaction.product_id && transaction.amount > 0) {
          balance += Number(transaction.amount);
        }
        // Add manual credit adjustments
        else if (transaction.payment_method === 'credito') {
          balance += Number(transaction.amount);
        }
        // Subtract withdrawals and manual debit adjustments
        else if (transaction.payment_method === 'saque' || transaction.payment_method === 'debito') {
          balance -= Math.abs(Number(transaction.amount));
        }
      });

      setCalculatedBalance(Math.max(0, balance)); // Ensure non-negative balance
    } catch (error) {
      console.error('Error calculating balance:', error);
      setCalculatedBalance(0);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data: plansData, error } = await supabase
        .from('plans')
        .select('id, name, price')
        .eq('is_active', true);

      if (error) throw error;
      setPlans(plansData || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleSaveChanges = async () => {
    if (!id) return;

    setSaving(true);
    try {
      // Check if plan changed to send notification
      const planChanged = userDetail?.plano_assinatura !== editableData.plano_assinatura;
      const oldPlan = userDetail?.plano_assinatura;
      const newPlan = editableData.plano_assinatura;

      const { error } = await supabase
        .from('profiles')
        .update({
          name: editableData.name,
          email: editableData.email,
          phone: editableData.phone,
          plano_assinatura: editableData.plano_assinatura,
          bank_name: editableData.bank_name,
          account_number: editableData.account_number,
          account_holder_name: editableData.account_holder_name,
          digital_wallet_type: editableData.digital_wallet_type === 'none' ? null : editableData.digital_wallet_type,
          digital_wallet_identifier: editableData.digital_wallet_identifier,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', id);

      if (error) throw error;

      // Send notification if plan changed
      if (planChanged) {
        const planNames = {
          'basico': 'Básico',
          'profissional': 'Profissional', 
          'empresarial': 'Empresarial'
        };

        const newPlanName = planNames[newPlan as keyof typeof planNames] || newPlan;
        
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: id,
            message: `Olá! O seu plano de assinatura foi alterado para ${newPlanName} pela nossa equipa de suporte.`,
            sender: 'Suporte',
            read: false
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
      }

      toast.success('Dados do usuário atualizados com sucesso!');
      fetchUserDetail(); // Refresh data
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof EditableUserData, value: string) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
  };

  const handleAdjustment = async (type: 'credit' | 'debit') => {
    if (!id || !adjustmentForm.amount || !adjustmentForm.justification) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const amount = parseFloat(adjustmentForm.amount);
    if (amount <= 0) {
      toast.error('O valor deve ser maior que zero');
      return;
    }

    try {
      const transactionAmount = type === 'debit' ? -amount : amount;
      const paymentMethod = type === 'debit' ? 'debito' : 'credito';

      const { data, error } = await supabase.functions.invoke('admin-manual-adjustment', {
        body: {
          userId: id,
          amount: amount,
          type,
          justification: adjustmentForm.justification,
        },
      });

      if (error) throw error;

      toast.success(`${type === 'credit' ? 'Crédito' : 'Débito'} aplicado com sucesso!`);
      setAdjustmentForm({ amount: '', justification: '' });
      setShowCreditModal(false);
      setShowDebitModal(false);
      
      // Refresh data
      await calculateUserBalance(id);
      fetchUserDetail();
    } catch (error) {
      console.error('Error creating adjustment:', error);
      toast.error('Erro ao aplicar ajuste');
    }
  };

  const handleSuspendUser = async () => {
    if (!id || !userDetail) return;

    setSuspending(true);
    try {
      const newStatus = (userDetail.status === 'suspended' || userDetail.status === 'suspenso') ? 'active' : 'suspended';
      
      const { error } = await supabase
        .from('profiles')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', id);

      if (error) throw error;

      setUserDetail(prev => prev ? { ...prev, status: newStatus } : null);
      
      toast.success(
        newStatus === 'suspended' 
          ? 'Conta suspensa com sucesso!' 
          : 'Conta reativada com sucesso!'
      );
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Erro ao alterar status da conta');
    } finally {
      setSuspending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/10 text-success border-success/20">Completo</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Carregando detalhes do usuário...</div>
      </div>
    );
  }

  if (!userDetail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-foreground">Usuário não encontrado</p>
          <Button onClick={() => navigate('/admin/users')}>Voltar</Button>
        </div>
      </div>
    );
  }

  const salesTransactions = transactions.filter(t => t.status === 'completed' && t.product_id);
  const totalRevenue = salesTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + Number(w.amount), 0);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <Button
                  variant="ghost"
                  onClick={() => navigate('/admin/users')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <img 
                  src={kixicoPayLogo} 
                  alt="KixicoPay" 
                  className="h-8 w-auto"
                />
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Editar Usuário</h1>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">{userDetail.name}</p>
                    {userDetail.status === 'online' && (
                      <Badge className="bg-success/10 text-success border-success/20 text-xs">ONLINE</Badge>
                    )}
                    {(userDetail.status === 'suspended' || userDetail.status === 'suspenso') && (
                      <Badge variant="destructive" className="text-xs">
                        SUSPENSA
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button onClick={handleSaveChanges} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
                <Button 
                  onClick={handleSuspendUser} 
                  disabled={suspending}
                  variant={(userDetail?.status === 'suspended' || userDetail?.status === 'suspenso') ? 'default' : 'destructive'}
                >
                  {(userDetail?.status === 'suspended' || userDetail?.status === 'suspenso') ? (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      {suspending ? 'Reativando...' : 'Reativar Conta'}
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4 mr-2" />
                      {suspending ? 'Suspendendo...' : 'Suspender Conta'}
                    </>
                  )}
                </Button>
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
              {/* User Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Saldo Atual
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                   <CardContent>
                     <div className="text-2xl font-bold text-foreground">
                       {calculatedBalance.toLocaleString('pt-AO')} AOA
                     </div>
                     <p className="text-xs text-muted-foreground mt-1">
                       Calculado automaticamente
                     </p>
                   </CardContent>
                </Card>

                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total de Vendas
                    </CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{salesTransactions.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Receita: {totalRevenue.toLocaleString('pt-AO')} AOA
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Produtos Ativos
                    </CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {products.filter(p => p.active).length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total: {products.length}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Sacado
                    </CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {totalWithdrawn.toLocaleString('pt-AO')} AOA
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {withdrawals.length} saques
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Editable User Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informações Pessoais */}
                <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <User className="h-5 w-5" />
                      Informações Pessoais
                    </CardTitle>
                    <CardDescription>
                      Dados básicos do usuário
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        value={editableData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Nome completo do usuário"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editableData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="E-mail do usuário"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={editableData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Telefone do usuário"
                      />
                    </div>
                     <div className="space-y-2">
                       <Label>Saldo Atual (Read-Only)</Label>
                       <div className="px-3 py-2 bg-muted rounded-md text-sm font-mono">
                         {calculatedBalance.toLocaleString('pt-AO')} AOA
                       </div>
                       <p className="text-xs text-muted-foreground">
                         Calculado automaticamente a partir das transações
                       </p>
                     </div>
                     <div className="flex gap-2">
                       <Button
                         type="button"
                         variant="outline"
                         size="sm"
                         onClick={() => setShowCreditModal(true)}
                         className="flex-1"
                       >
                         <DollarSign className="h-4 w-4 mr-2" />
                         Adicionar Crédito
                       </Button>
                       <Button
                         type="button"
                         variant="outline"
                         size="sm"
                         onClick={() => setShowDebitModal(true)}
                         className="flex-1"
                       >
                         <DollarSign className="h-4 w-4 mr-2" />
                         Aplicar Débito
                       </Button>
                     </div>
                    <div className="space-y-2">
                      <Label htmlFor="plan">Plano de Assinatura</Label>
                      <Select
                        value={editableData.plano_assinatura}
                        onValueChange={(value) => handleInputChange('plano_assinatura', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o plano" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basico">Básico</SelectItem>
                          <SelectItem value="profissional">Profissional</SelectItem>
                          <SelectItem value="empresarial">Empresarial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Dados Financeiros */}
                <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <CreditCard className="h-5 w-5" />
                      Dados Financeiros
                    </CardTitle>
                    <CardDescription>
                      Informações bancárias e carteira digital
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bank_name">Nome do Banco</Label>
                      <Input
                        id="bank_name"
                        value={editableData.bank_name}
                        onChange={(e) => handleInputChange('bank_name', e.target.value)}
                        placeholder="Ex: Banco BAI"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account_holder_name">Nome do Titular</Label>
                      <Input
                        id="account_holder_name"
                        value={editableData.account_holder_name}
                        onChange={(e) => handleInputChange('account_holder_name', e.target.value)}
                        placeholder="Nome do titular da conta"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account_number">Número da Conta</Label>
                      <Input
                        id="account_number"
                        value={editableData.account_number}
                        onChange={(e) => handleInputChange('account_number', e.target.value)}
                        placeholder="Número da conta bancária"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="digital_wallet_type">Tipo de Carteira Digital</Label>
                      <Select
                        value={editableData.digital_wallet_type}
                        onValueChange={(value) => handleInputChange('digital_wallet_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de carteira" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          <SelectItem value="multicaixa">Multicaixa Express</SelectItem>
                          <SelectItem value="unitel">Unitel Money</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="digital_wallet_identifier">Identificador da Carteira</Label>
                      <Input
                        id="digital_wallet_identifier"
                        value={editableData.digital_wallet_identifier}
                        onChange={(e) => handleInputChange('digital_wallet_identifier', e.target.value)}
                        placeholder="Email, telefone ou ID da carteira"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Tabs */}
              <Tabs defaultValue="transactions" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="transactions">Transações</TabsTrigger>
                  <TabsTrigger value="products">Produtos</TabsTrigger>
                  <TabsTrigger value="withdrawals">Saques</TabsTrigger>
                </TabsList>

                <TabsContent value="transactions">
                  <Card className="border-border/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-foreground">Histórico de Transações</CardTitle>
                      <CardDescription>Todas as transações realizadas pelo usuário</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border border-border/50">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Cliente</TableHead>
                              <TableHead>Produto</TableHead>
                              <TableHead>Valor</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Data</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transactions.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                  Nenhuma transação encontrada
                                </TableCell>
                              </TableRow>
                            ) : (
                              transactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{transaction.customer_name}</p>
                                      <p className="text-sm text-muted-foreground">{transaction.customer_email}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {transaction.product_id 
                                      ? (transaction.product_name || 'Produto não encontrado')
                                      : transaction.payment_method === 'saque'
                                        ? 'Saque Aprovado'
                                        : transaction.payment_method === 'credito'
                                          ? 'Ajuste Manual (Crédito)'
                                          : transaction.payment_method === 'debito'
                                            ? 'Ajuste Manual (Débito)'
                                            : 'Transação do Sistema'
                                    }
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {transaction.amount.toLocaleString('pt-AO')} AOA
                                  </TableCell>
                                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                                  <TableCell>
                                    {new Date(transaction.created_at).toLocaleDateString('pt-AO', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="products">
                  <Card className="border-border/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-foreground">Produtos do Usuário</CardTitle>
                      <CardDescription>Todos os produtos cadastrados</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border border-border/50">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Preço</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Data de Criação</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {products.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                  Nenhum produto encontrado
                                </TableCell>
                              </TableRow>
                            ) : (
                              products.map((product) => (
                                <TableRow key={product.id}>
                                  <TableCell className="font-medium">{product.name}</TableCell>
                                  <TableCell>{product.price.toLocaleString('pt-AO')} AOA</TableCell>
                                  <TableCell>
                                    {product.active ? (
                                      <Badge className="bg-success/10 text-success border-success/20">Ativo</Badge>
                                    ) : (
                                      <Badge variant="secondary">Inativo</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {new Date(product.created_at).toLocaleDateString('pt-AO', {
                                      day: '2-digit',
                                      month: '2-digit',  
                                      year: 'numeric'
                                    })}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="withdrawals">
                  <Card className="border-border/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-foreground">Histórico de Saques</CardTitle>
                      <CardDescription>Todos os saques realizados pelo usuário</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border border-border/50">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Valor</TableHead>
                              <TableHead>Banco</TableHead>
                              <TableHead>Conta</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Data</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {withdrawals.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                  Nenhum saque encontrado
                                </TableCell>
                              </TableRow>
                            ) : (
                              withdrawals.map((withdrawal) => (
                                <TableRow key={withdrawal.id}>
                                  <TableCell className="font-medium">
                                    {withdrawal.amount.toLocaleString('pt-AO')} AOA
                                  </TableCell>
                                  <TableCell>{withdrawal.bank_name || 'N/A'}</TableCell>
                                  <TableCell>{withdrawal.account_number || 'N/A'}</TableCell>
                                  <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                                  <TableCell>
                                    {new Date(withdrawal.created_at).toLocaleDateString('pt-AO', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>

      {/* Credit Adjustment Modal */}
      <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Crédito</DialogTitle>
            <DialogDescription>
              Adicione crédito à conta do usuário. Esta ação criará uma nova transação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="credit-amount">Valor (AOA)</Label>
              <Input
                id="credit-amount"
                type="number"
                step="0.01"
                value={adjustmentForm.amount}
                onChange={(e) => setAdjustmentForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit-justification">Justificativa (Obrigatória)</Label>
              <Input
                id="credit-justification"
                value={adjustmentForm.justification}
                onChange={(e) => setAdjustmentForm(prev => ({ ...prev, justification: e.target.value }))}
                placeholder="Ex: Bônus de desempenho, correção de erro..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleAdjustment('credit')}>
              Adicionar Crédito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Debit Adjustment Modal */}
      <Dialog open={showDebitModal} onOpenChange={setShowDebitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar Débito</DialogTitle>
            <DialogDescription>
              Remova fundos da conta do usuário. Esta ação criará uma nova transação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="debit-amount">Valor (AOA)</Label>
              <Input
                id="debit-amount"
                type="number"
                step="0.01"
                value={adjustmentForm.amount}
                onChange={(e) => setAdjustmentForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debit-justification">Justificativa (Obrigatória)</Label>
              <Input
                id="debit-justification"
                value={adjustmentForm.justification}
                onChange={(e) => setAdjustmentForm(prev => ({ ...prev, justification: e.target.value }))}
                placeholder="Ex: Taxa administrativa, correção de erro..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDebitModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleAdjustment('debit')}
            >
              Aplicar Débito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </SidebarProvider>
  );
}