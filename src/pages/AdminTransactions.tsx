import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminSidebar } from '@/components/AdminSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Download } from 'lucide-react';
import { NotificationCenter } from '@/components/NotificationCenter';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import kixicoPayLogo from "/lovable-uploads/aaa7ebd4-937a-41c9-ab8e-25102e62b1ed.png";

interface TransactionData {
  id: string;
  amount: number;
  status: string;
  customer_name: string;
  customer_email: string;
  payment_method?: string;
  created_at: string;
  type: 'sale' | 'withdrawal';
  product_name?: string;
  user_name?: string;
}

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchTransactions() {
      try {
        // Fetch sales transactions
        const { data: salesData, error: salesError } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false });

        if (salesError) throw salesError;

        // Fetch products separately
        const { data: products } = await supabase
          .from('products')
          .select('id, name');

        // Fetch profiles separately
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, email');

        // Fetch withdrawal transactions
        const { data: withdrawalsData, error: withdrawalsError } = await supabase
          .from('withdrawals')
          .select('*')
          .order('created_at', { ascending: false });

        if (withdrawalsError) throw withdrawalsError;

        // Combine and format data
        const salesTransactions = salesData?.map(transaction => {
          const product = products?.find(p => p.id === transaction.product_id);
          const userProfile = profiles?.find(p => p.user_id === transaction.user_id);
          
          return {
            id: transaction.id,
            amount: Number(transaction.amount),
            status: transaction.status,
            customer_name: transaction.customer_name || 'N/A',
            customer_email: transaction.customer_email,
            payment_method: transaction.payment_method,
            created_at: transaction.created_at,
            type: 'sale' as const,
            product_name: product?.name,
            user_name: userProfile?.name
          };
        }) || [];

        const withdrawalTransactions = withdrawalsData?.map(withdrawal => {
          const userProfile = profiles?.find(p => p.user_id === withdrawal.user_id);
          
          return {
            id: withdrawal.id,
            amount: Number(withdrawal.amount),
            status: withdrawal.status,
            customer_name: userProfile?.name || 'N/A',
            customer_email: userProfile?.email || 'N/A',
            payment_method: 'Saque',
            created_at: withdrawal.created_at,
            type: 'withdrawal' as const,
            user_name: userProfile?.name
          };
        }) || [];

        // Combine and sort by date
        const allTransactions = [...salesTransactions, ...withdrawalTransactions]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setTransactions(allTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.product_name && transaction.product_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

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

  const getTypeBadge = (type: string) => {
    return type === 'sale' ? 
      <Badge className="bg-primary/10 text-primary border-primary/20">Venda</Badge> :
      <Badge className="bg-accent/10 text-accent-foreground border-accent/20">Saque</Badge>;
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
                  <h1 className="text-xl font-semibold text-foreground">Gestão de Transações</h1>
                  <p className="text-sm text-muted-foreground">Histórico completo de vendas e saques</p>
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
              <Card className="border-border/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-foreground">Histórico de Transações</CardTitle>
                  <CardDescription>
                    Todas as vendas e saques processados na plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar transações..."
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
                        <SelectItem value="completed">Completo</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="failed">Falhou</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Tipos</SelectItem>
                        <SelectItem value="sale">Vendas</SelectItem>
                        <SelectItem value="withdrawal">Saques</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-md border border-border/50">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Cliente/Vendedor</TableHead>
                          <TableHead>E-mail</TableHead>
                          <TableHead>Produto/Detalhes</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8">
                              Carregando transações...
                            </TableCell>
                          </TableRow>
                        ) : filteredTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                                ? 'Nenhuma transação encontrada com os filtros aplicados.' 
                                : 'Nenhuma transação encontrada.'}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTransactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                              <TableCell className="font-medium">{transaction.customer_name}</TableCell>
                              <TableCell>{transaction.customer_email}</TableCell>
                              <TableCell>{transaction.product_name || transaction.payment_method}</TableCell>
                              <TableCell className="font-medium">
                                {transaction.amount.toLocaleString('pt-AO')} AOA
                              </TableCell>
                              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                              <TableCell>
                                {new Date(transaction.created_at).toLocaleDateString('pt-AO', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/admin/invoice/${transaction.id}`)}
                                  className="flex items-center gap-2"
                                >
                                  <Download className="w-4 h-4" />
                                  Baixar Fatura
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
                      Mostrando {filteredTransactions.length} de {transactions.length} transações
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