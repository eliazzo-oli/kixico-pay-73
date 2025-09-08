import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminSidebar } from '@/components/AdminSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { NotificationCenter } from '@/components/NotificationCenter';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuth } from '@/hooks/useAuth';
import kixicoPayLogo from "/lovable-uploads/aaa7ebd4-937a-41c9-ab8e-25102e62b1ed.png";
import { toast } from 'sonner';

interface WithdrawalData {
  id: string;
  amount: number;
  status: string;
  bank_name?: string;
  account_number?: string;
  created_at: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  account_holder_name?: string;
}

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user, signOut } = useAuth();

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  async function fetchWithdrawals() {
    try {
      // Fetch withdrawals first
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });

      if (withdrawalsError) throw withdrawalsError;

      // Fetch profiles separately
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email, phone, account_holder_name');

      const formattedWithdrawals = withdrawalsData?.map(withdrawal => {
        const userProfile = profiles?.find(p => p.user_id === withdrawal.user_id);
        
        return {
          id: withdrawal.id,
          amount: Number(withdrawal.amount),
          status: withdrawal.status,
          bank_name: withdrawal.bank_name,
          account_number: withdrawal.account_number,
          created_at: withdrawal.created_at,
          user_id: withdrawal.user_id,
          user_name: userProfile?.name || 'N/A',
          user_email: userProfile?.email || 'N/A',
          user_phone: userProfile?.phone,
          account_holder_name: userProfile?.account_holder_name,
        };
      }) || [];

      setWithdrawals(formattedWithdrawals);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Erro ao carregar solicitações de saque');
    } finally {
      setLoading(false);
    }
  }

  const updateWithdrawalStatus = async (withdrawalId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({ status: newStatus })
        .eq('id', withdrawalId);

      if (error) throw error;

      // Update local state
      setWithdrawals(prev => 
        prev.map(w => w.id === withdrawalId ? { ...w, status: newStatus } : w)
      );

      toast.success(`Saque ${newStatus === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso`);
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      toast.error('Erro ao atualizar status do saque');
    }
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = 
      withdrawal.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.bank_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.account_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || withdrawal.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
                  <h1 className="text-xl font-semibold text-foreground">Solicitações de Saque</h1>
                  <p className="text-sm text-muted-foreground">Gerenciar todas as solicitações de saque</p>
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
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Saques</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{withdrawals.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Saques Pendentes</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {withdrawals.filter(w => w.status === 'pending').length}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valor Total Solicitado</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {withdrawals.reduce((sum, w) => sum + w.amount, 0).toLocaleString('pt-AO')} AOA
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters and Search */}
              <Card>
                <CardHeader>
                  <CardTitle>Filtros</CardTitle>
                  <CardDescription>
                    Pesquise e filtre as solicitações de saque
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Pesquisar por nome, email ou dados bancários..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="approved">Aprovado</SelectItem>
                        <SelectItem value="rejected">Rejeitado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Withdrawals Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Solicitações de Saque</CardTitle>
                  <CardDescription>
                    Lista completa de todas as solicitações de saque
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Carregando...</div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Dados Bancários</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredWithdrawals.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                Nenhuma solicitação de saque encontrada
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredWithdrawals.map((withdrawal) => (
                              <TableRow key={withdrawal.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{withdrawal.user_name}</div>
                                    <div className="text-sm text-muted-foreground">{withdrawal.user_email}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {withdrawal.user_phone && (
                                      <div>Tel: {withdrawal.user_phone}</div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono">
                                  {withdrawal.amount.toLocaleString('pt-AO')} AOA
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm space-y-1">
                                    {withdrawal.bank_name && (
                                      <div><strong>Banco:</strong> {withdrawal.bank_name}</div>
                                    )}
                                    {withdrawal.account_number && (
                                      <div><strong>Conta:</strong> {withdrawal.account_number}</div>
                                    )}
                                    {withdrawal.account_holder_name && (
                                      <div><strong>Titular:</strong> {withdrawal.account_holder_name}</div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(withdrawal.status)}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {new Date(withdrawal.created_at).toLocaleDateString('pt-AO')}
                                </TableCell>
                                <TableCell>
                                  {withdrawal.status === 'pending' && (
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => updateWithdrawalStatus(withdrawal.id, 'approved')}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        Aprovar
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => updateWithdrawalStatus(withdrawal.id, 'rejected')}
                                      >
                                        Rejeitar
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
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