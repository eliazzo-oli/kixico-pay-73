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
  customer_name: string;
  customer_email: string;
  amount: number;
  status: string;
  created_at: string;
  payment_method: string;
  product_id: string | null;
  product_name: string;
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
  const [products, setProducts] = useState([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [biImageUrl, setBiImageUrl] = useState<string>('');
  const [nifImageUrl, setNifImageUrl] = useState<string>('');
  
  useEffect(() => {
    if (id) {
      fetchUserDetails();
      fetchTransactions();
      fetchProducts();
      fetchWithdrawals();
      fetchPlans();
    }
  }, [id]);

  const fetchUserDetails = async () => {
    if (!id) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', id)
        .single();

      if (error) throw error;

      setUserDetail(profile);
      setCalculatedBalance(profile.balance || 0);
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

      // Load documents
      await loadDocuments();
    } catch (error) {
      console.error('Erro ao buscar detalhes do usuário:', error);
      toast.error('Erro ao carregar dados do usuário');
    }
  };

  const loadDocuments = async () => {
    if (!id) return;

    try {
      // Load BI document
      const { data: biFiles } = await supabase.storage
        .from('avatars')
        .list(`documents/${id}/bi/`);

      if (biFiles && biFiles.length > 0) {
        const { data: biUrl } = supabase.storage
          .from('avatars')
          .getPublicUrl(`documents/${id}/bi/${biFiles[0].name}`);
        setBiImageUrl(biUrl.publicUrl);
      }

      // Load NIF document
      const { data: nifFiles } = await supabase.storage
        .from('avatars')
        .list(`documents/${id}/nif/`);

      if (nifFiles && nifFiles.length > 0) {
        const { data: nifUrl } = supabase.storage
          .from('avatars')
          .getPublicUrl(`documents/${id}/nif/${nifFiles[0].name}`);
        setNifImageUrl(nifUrl.publicUrl);
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    }
  };

  const fetchTransactions = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          customer_name,
          customer_email,
          amount,
          status,
          created_at,
          payment_method,
          product_id,
          products (name)
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedTransactions = data.map(transaction => ({
        id: transaction.id,
        customer_name: transaction.customer_name,
        customer_email: transaction.customer_email,
        amount: transaction.amount,
        status: transaction.status,
        created_at: transaction.created_at,
        payment_method: transaction.payment_method,
        product_id: transaction.product_id,
        product_name: transaction.products?.name || 'Produto não encontrado'
      }));

      setTransactions(mappedTransactions);

      // Calculate balance using the correct formula:
      // Saldo = (Soma de todas as Vendas + Ajustes de Crédito) - (Saques Aprovados + Ajustes de Débito)
      let balance = 0;

      data.forEach(transaction => {
        // Add completed sales and manual credit adjustments
        if ((transaction.status === 'completed' && transaction.product_id) || 
            transaction.payment_method === 'credito') {
          balance += Number(transaction.amount);
        }
        // Subtract withdrawals and manual debit adjustments
        else if (transaction.payment_method === 'saque' || transaction.payment_method === 'debito') {
          balance -= Math.abs(Number(transaction.amount));
        }
      });

      setCalculatedBalance(balance);

      // Update the balance in the database to match calculated value
      await supabase
        .from('profiles')
        .update({ balance: balance })
        .eq('user_id', id);

    } catch (error) {
      console.error('Erro ao buscar transações:', error);
    }
  };

  const fetchProducts = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const fetchWithdrawals = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Erro ao buscar saques:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
  };

  const saveChanges = async () => {
    if (!id) return;

    try {
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

      toast.success('Dados salvos com sucesso!');
      fetchUserDetails();
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      toast.error('Erro ao salvar dados');
    }
  };

  const toggleUserStatus = async () => {
    if (!id || !userDetail) return;

    const newStatus = userDetail.status === 'active' ? 'banned' : 'active';

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('user_id', id);

      if (error) throw error;

      toast.success(`Usuário ${newStatus === 'active' ? 'ativado' : 'banido'} com sucesso!`);
      fetchUserDetails();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do usuário');
    }
  };

  const handleAdjustment = async (type: 'credit' | 'debit') => {
    if (!id || !adjustmentForm.amount || !adjustmentForm.justification) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const amount = parseFloat(adjustmentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Valor deve ser um número positivo');
      return;
    }

    try {
      const transactionAmount = type === 'debit' ? -amount : amount;
      const paymentMethod = type === 'debit' ? 'debito' : 'credito';

      const { data, error } = await supabase.functions.invoke('admin-manual-adjustment', {
        body: {
          userId: id,
          amount: transactionAmount,
          justification: adjustmentForm.justification,
          paymentMethod: paymentMethod
        }
      });

      if (error) throw error;

      toast.success(`${type === 'credit' ? 'Crédito' : 'Débito'} aplicado com sucesso!`);
      setAdjustmentForm({ amount: '', justification: '' });
      setShowCreditModal(false);
      setShowDebitModal(false);
      
      // Refresh data
      fetchTransactions();
      fetchUserDetails();
    } catch (error) {
      console.error('Erro ao aplicar ajuste:', error);
      toast.error('Erro ao aplicar ajuste');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completado</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'premium':
        return <Badge variant="default" className="bg-gradient-to-r from-orange-400 to-orange-600">Premium</Badge>;
      case 'basico':
        return <Badge variant="secondary">Básico</Badge>;
      case 'empresarial':
        return <Badge variant="default" className="bg-gradient-to-r from-blue-500 to-blue-700">Empresarial</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  if (!userDetail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <AdminSidebar />
        <div className="lg:pl-64">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background/95 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="lg:hidden" />
            
            <div className="flex items-center gap-4 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              
              <div className="h-6 w-px bg-border mx-2" />
              
              <div className="flex items-center gap-3">
                <UserAvatar userId={userDetail.user_id} size="sm" />
                <div>
                  <h1 className="text-lg font-semibold text-foreground">{userDetail.name}</h1>
                  <p className="text-sm text-muted-foreground">{userDetail.email}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <img src={kixicoPayLogo} alt="KixicoPay" className="h-8 w-auto" />
              <NotificationCenter />
            </div>
          </header>

          <main className="py-8 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-8">
              {/* Header Actions */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {getPlanBadge(userDetail.plano_assinatura)}
                  <Badge 
                    variant={userDetail.status === 'active' ? 'default' : 'destructive'}
                    className={userDetail.status === 'active' ? 'bg-green-500' : ''}
                  >
                    {userDetail.status === 'active' ? 'Ativo' : 'Banido'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveChanges} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </Button>
                  <Button 
                    onClick={toggleUserStatus}
                    variant={userDetail.status === 'active' ? 'destructive' : 'default'}
                    size="sm"
                  >
                    {userDetail.status === 'active' ? (
                      <>
                        <Ban className="w-4 h-4 mr-2" />
                        Banir Usuário
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Ativar Usuário
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Atual</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{calculatedBalance.toLocaleString('pt-AO')} AOA</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Calculado automaticamente
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total de Vendas</CardTitle>
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
                    <CardTitle className="text-sm font-medium text-muted-foreground">Produtos</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{products.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total cadastrados
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Sacado</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{totalWithdrawn.toLocaleString('pt-AO')} AOA</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {withdrawals.filter(w => w.status === 'completed').length} saques
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* User Information Tabs */}
              <Tabs defaultValue="personal" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
                  <TabsTrigger value="financial">Dados Financeiros</TabsTrigger>
                  <TabsTrigger value="details">Detalhes</TabsTrigger>
                </TabsList>

                <TabsContent value="personal">
                  <Card className="border-border/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-foreground">Informações Pessoais</CardTitle>
                      <CardDescription>Dados básicos do usuário</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome</Label>
                          <Input
                            id="name"
                            value={editableData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Nome completo"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={editableData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="email@exemplo.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            value={editableData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="+244 900 000 000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="plan">Plano de Assinatura</Label>
                          <Select
                            value={editableData.plano_assinatura}
                            onValueChange={(value) => handleInputChange('plano_assinatura', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um plano" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basico">Básico</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                              <SelectItem value="empresarial">Empresarial</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex justify-center pt-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCreditModal(true)}
                            className="flex-1"
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Adicionar Crédito
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDebitModal(true)}
                            className="flex-1"
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Aplicar Débito
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="financial">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-border/50 shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-foreground">Dados Bancários</CardTitle>
                        <CardDescription>
                          Informações da conta bancária para saques
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
                          <Label htmlFor="account_number">IBAN</Label>
                          <Input
                            id="account_number"
                            value={editableData.account_number}
                            onChange={(e) => handleInputChange('account_number', e.target.value)}
                            placeholder="PT50 0000 0000 0000 0000 0000 0"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-foreground">Carteira Digital</CardTitle>
                        <CardDescription>
                          Configurações de carteira eletrônica
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="digital_wallet_type">Tipo de Carteira</Label>
                          <Select
                            value={editableData.digital_wallet_type || 'none'}
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
                </TabsContent>

                <TabsContent value="details">
              {/* Detailed Tabs */}
              <Tabs defaultValue="transactions" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="transactions">Transações</TabsTrigger>
                  <TabsTrigger value="products">Produtos</TabsTrigger>
                  <TabsTrigger value="withdrawals">Saques</TabsTrigger>
                  <TabsTrigger value="documents">Documentos</TabsTrigger>
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
                                  <TableCell>
                                    {getStatusBadge(transaction.status)}
                                  </TableCell>
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
                      <CardTitle className="text-foreground">Produtos</CardTitle>
                      <CardDescription>Lista de produtos criados pelo usuário</CardDescription>
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
                              products.map((product: Product) => (
                                <TableRow key={product.id}>
                                  <TableCell className="font-medium">{product.name}</TableCell>
                                  <TableCell>{product.price.toLocaleString('pt-AO')} AOA</TableCell>
                                  <TableCell>
                                    <Badge variant={product.active ? "default" : "secondary"}>
                                      {product.active ? "Ativo" : "Inativo"}
                                    </Badge>
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
                      <CardDescription>Solicitações de saque realizadas pelo usuário</CardDescription>
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

                <TabsContent value="documents">
                  <Card className="border-border/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-foreground">Documentos de Identificação</CardTitle>
                      <CardDescription>Documentos enviados pelo usuário</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* BI Document */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-foreground">Bilhete de Identidade (BI)</h3>
                          {biImageUrl ? (
                            <div className="border border-border rounded-lg p-4">
                              <img 
                                src={biImageUrl} 
                                alt="Bilhete de Identidade" 
                                className="w-full h-auto max-h-96 object-contain rounded-md"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling!.style.display = 'block';
                                }}
                              />
                              <div className="text-center text-muted-foreground text-sm mt-2 hidden">
                                Erro ao carregar imagem
                              </div>
                            </div>
                          ) : (
                            <div className="border border-dashed border-border rounded-lg p-8 text-center">
                              <p className="text-muted-foreground">Nenhum documento BI encontrado</p>
                            </div>
                          )}
                        </div>

                        {/* NIF Document */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-foreground">NIF da Empresa</h3>
                          {nifImageUrl ? (
                            <div className="border border-border rounded-lg p-4">
                              <img 
                                src={nifImageUrl} 
                                alt="NIF da Empresa" 
                                className="w-full h-auto max-h-96 object-contain rounded-md"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling!.style.display = 'block';
                                }}
                              />
                              <div className="text-center text-muted-foreground text-sm mt-2 hidden">
                                Erro ao carregar imagem
                              </div>
                            </div>
                          ) : (
                            <div className="border border-dashed border-border rounded-lg p-8 text-center">
                              <p className="text-muted-foreground">Nenhum documento NIF encontrado</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
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