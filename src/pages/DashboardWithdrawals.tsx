import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Home } from 'lucide-react';
import { MobileWithdrawalList } from '@/components/MobileWithdrawalList';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { TrialBanner } from '@/components/TrialBanner';
import { usePlan } from '@/hooks/usePlan';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  bank_name?: string;
  account_number?: string;
  user_id: string;
  currency: string;
}

interface WalletBalance {
  currency: 'AOA' | 'BRL';
  balance: number;
}

export default function DashboardWithdrawals() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentPlan, features, hasFeature, getPlanDisplayName } = usePlan();
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<'AOA' | 'BRL'>((location.state as any)?.selectedCurrency || 'AOA');
  const { toast } = useToast();

  console.log('DashboardWithdrawals rendered', { user, withdrawalAmount, selectedCurrency });

  const minimumWithdrawal = 5000; // 50,00 AOA or BRL

  const availableBalance = wallets.find(w => w.currency === selectedCurrency)?.balance || 0;

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch wallets
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('currency, balance')
        .eq('user_id', user?.id)
        .order('currency', { ascending: true });

      if (walletsError) throw walletsError;
      setWallets((walletsData || []) as WalletBalance[]);

      // Fetch user withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (withdrawalsError) throw withdrawalsError;

      setWithdrawals((withdrawalsData || []).map(w => ({
        ...w,
        status: w.status as 'pending' | 'approved' | 'rejected',
        currency: w.currency || 'AOA'
      })));
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals based on real data and selected currency
  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'approved' && w.currency === selectedCurrency)
    .reduce((sum, w) => sum + Number(w.amount), 0);

  const pendingWithdrawals = withdrawals.filter(w => 
    w.status === 'pending' && w.currency === selectedCurrency
  ).length;

  const formatPrice = (priceInCents: number) => {
    const value = priceInCents / 100;
    return value.toLocaleString('pt-AO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' AOA';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    const amount = Math.round(parseFloat(withdrawalAmount) * 100);
    const withdrawalFee = features.withdrawalFee;
    const feeAmount = Math.round(amount * (withdrawalFee / 100));
    const totalDeducted = amount + feeAmount;
    
    if (amount < minimumWithdrawal) {
      toast({
        title: "Valor mínimo não atingido",
        description: `O valor mínimo para saque é ${formatPrice(minimumWithdrawal)}.`,
        variant: "destructive",
      });
      return;
    }

    if (totalDeducted > availableBalance) {
      toast({
        title: "Saldo insuficiente",
        description: `O valor solicitado mais a taxa de ${withdrawalFee}% (${formatPrice(feeAmount)}) é maior que o saldo disponível.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: amount / 100, // Convert back to normal value
          status: 'pending',
          currency: selectedCurrency,
        });

      if (error) throw error;

      // Refresh data
      await fetchUserData();
      
      // Reset form
      setWithdrawalAmount('');

      const feeText = withdrawalFee > 0 ? ` (taxa de ${withdrawalFee}%: ${formatPrice(feeAmount)})` : '';
      toast({
        title: "Saque solicitado",
        description: `Sua solicitação de saque de ${formatPrice(amount)} foi enviada${feeText}.`,
      });
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      toast({
        title: "Erro",
        description: "Erro ao solicitar saque. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-primary" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovado';
      case 'pending':
        return 'Pendente';
      case 'rejected':
        return 'Rejeitado';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'outline';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen bg-background">
          <DashboardSidebar />
          <main className="flex-1 p-6">
            <TrialBanner />
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="text-center py-8">
                <p>Carregando dados...</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <TrialBanner />
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Saques</h1>
                <p className="text-muted-foreground mt-2">
                  Solicite saques e acompanhe o histórico de suas retiradas - Plano {getPlanDisplayName(currentPlan)} ({features.withdrawalTime})
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Voltar ao Dashboard
              </Button>
            </div>

            {/* Stats Cards - Grid 2 cols on mobile */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              <Card className="border-border/50 col-span-2 md:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                    Saldo Disponível
                  </CardTitle>
                  <DollarSign className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold text-foreground">
                    {formatPrice(availableBalance)}
                  </div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
                    Disponível para saque
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                    Total Sacado
                  </CardTitle>
                  <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold text-foreground">
                    {formatPrice(totalWithdrawn)}
                  </div>
                  <p className="text-[10px] md:text-xs text-success mt-0.5 md:mt-1">
                    Aprovados
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                    Pendentes
                  </CardTitle>
                  <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold text-foreground">{pendingWithdrawals}</div>
                  <p className="text-[10px] md:text-xs text-warning mt-0.5 md:mt-1">
                    Em processamento
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Withdrawal Request Form */}
            {hasFeature('hasInstantWithdrawals') && (
              <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg">
                <h3 className="font-semibold text-foreground">🚀 Saques Instantâneos Disponíveis</h3>
                <p className="text-sm text-muted-foreground">
                  Seu plano {getPlanDisplayName(currentPlan)} inclui saques instantâneos!
                </p>
              </div>
            )}
            
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground">Solicitar Saque</CardTitle>
                <CardDescription>
                  Preencha o valor para solicitar um novo saque. Valor mínimo: {formatPrice(minimumWithdrawal)} | Taxa: {features.withdrawalFee}% | Tempo de processamento: {features.withdrawalTime}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRequestWithdrawal} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Carteira</Label>
                    <select
                      id="currency"
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value as 'AOA' | 'BRL')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="AOA">AOA - Kwanza Angolano (Saldo: {formatPrice(wallets.find(w => w.currency === 'AOA')?.balance || 0)})</option>
                      <option value="BRL">BRL - Real Brasileiro (Saldo: {formatPrice(wallets.find(w => w.currency === 'BRL')?.balance || 0)})</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor do Saque ({selectedCurrency})</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full md:w-auto">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Solicitar Saque
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Withdrawal History */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground">Histórico de Saques</CardTitle>
                <CardDescription>
                  Acompanhe todas as suas solicitações de saque
                </CardDescription>
              </CardHeader>
              <CardContent>
                {withdrawals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhuma solicitação de saque encontrada.</p>
                    <p className="text-sm mt-2">Faça sua primeira solicitação de saque acima.</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile: Card List */}
                    <div className="md:hidden">
                      <MobileWithdrawalList
                        withdrawals={withdrawals}
                        formatPrice={formatPrice}
                        formatDate={formatDate}
                      />
                    </div>
                    
                    {/* Desktop: Table */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Valor Solicitado</TableHead>
                            <TableHead>Data da Solicitação</TableHead>
                            <TableHead>Última Atualização</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {withdrawals.map((withdrawal) => (
                            <TableRow key={withdrawal.id}>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(withdrawal.status)}
                                  <Badge variant={getStatusVariant(withdrawal.status)}>
                                    {getStatusText(withdrawal.status)}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="font-semibold">
                                {formatPrice(Number(withdrawal.amount) * 100)}
                              </TableCell>
                              <TableCell>{formatDate(withdrawal.created_at)}</TableCell>
                              <TableCell>{formatDate(withdrawal.updated_at)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}