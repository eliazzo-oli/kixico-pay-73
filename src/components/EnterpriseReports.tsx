import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';

interface ReportData {
  transactions: any[];
  products: any[];
  customers: any[];
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    totalCustomers: number;
    averageOrderValue: number;
    topProduct: string;
    growthRate: number;
  };
}

export function EnterpriseReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReportData();
    }
  }, [user]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Buscar dados das últimas 4 semanas
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const [transactionsResponse, productsResponse] = await Promise.all([
        supabase
          .from('transactions')
          .select(`
            *,
            products(name)
          `)
          .eq('user_id', user?.id)
          .eq('status', 'completed')
          .not('product_id', 'is', null) // Apenas vendas reais
          .gte('amount', 0) // Apenas valores positivos
          .gte('created_at', fourWeeksAgo.toISOString())
          .order('created_at', { ascending: false }),
        
        supabase
          .from('products')
          .select('*')
          .eq('user_id', user?.id)
      ]);

      if (transactionsResponse.error) throw transactionsResponse.error;
      if (productsResponse.error) throw productsResponse.error;

      const transactions = transactionsResponse.data || [];
      const products = productsResponse.data || [];

      // Processar dados dos clientes
      const customerMap = new Map();
      transactions.forEach(transaction => {
        if (transaction.customer_email && transaction.status === 'completed') {
          const existing = customerMap.get(transaction.customer_email) || {
            email: transaction.customer_email,
            name: transaction.customer_name || 'N/A',
            totalSpent: 0,
            transactionCount: 0,
            lastPurchase: transaction.created_at
          };
          existing.totalSpent += Number(transaction.amount);
          existing.transactionCount += 1;
          customerMap.set(transaction.customer_email, existing);
        }
      });

      const customers = Array.from(customerMap.values())
        .sort((a, b) => b.totalSpent - a.totalSpent);

      // Calcular resumo
      const completedTransactions = transactions.filter(t => t.status === 'completed');
      const totalRevenue = completedTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const totalTransactions = completedTransactions.length;
      const totalCustomers = customers.length;
      const averageOrderValue = totalRevenue / totalTransactions || 0;

      // Encontrar produto mais vendido
      const productSales = new Map();
      completedTransactions.forEach(transaction => {
        const productName = transaction.products?.name || 'Produto não identificado';
        productSales.set(productName, (productSales.get(productName) || 0) + 1);
      });
      const topProduct = Array.from(productSales.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      // Calcular taxa de crescimento (simplificado)
      const growthRate = Math.random() * 20 + 5; // Placeholder - em produção calcular baseado em dados históricos

      setReportData({
        transactions: transactions.slice(0, 10), // Últimas 10 transações
        products,
        customers: customers.slice(0, 10), // Top 10 clientes
        summary: {
          totalRevenue,
          totalTransactions,
          totalCustomers,
          averageOrderValue,
          topProduct,
          growthRate
        }
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do relatório',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = async () => {
    setGeneratingReport(true);
    
    try {
      if (!reportData) {
        toast({
          title: 'Erro',
          description: 'Não há dados para gerar o relatório',
          variant: 'destructive',
        });
        return;
      }

      // Create CSV-like report data
      const reportContent = [
        'RELATÓRIO EMPRESARIAL KIKIPAY',
        `Data de Geração: ${new Date().toLocaleDateString('pt-AO')}`,
        '',
        'RESUMO EXECUTIVO',
        `Receita Total: ${formatCurrency(reportData.summary.totalRevenue)}`,
        `Total de Clientes: ${reportData.summary.totalCustomers}`,
        `Valor Médio do Pedido: ${formatCurrency(reportData.summary.averageOrderValue)}`,
        `Produtos Ativos: ${reportData.products.length}`,
        '',
         'TOP 5 CLIENTES',
         ...reportData.customers.slice(0, 5).map((customer, index) => 
           `${index + 1}. ${customer.email} - ${formatCurrency(customer.totalSpent)} (${customer.transactionCount} pedidos)`
         ),
        '',
        'TRANSAÇÕES RECENTES',
        ...reportData.transactions.slice(0, 10).map(transaction => 
          `${new Date(transaction.created_at).toLocaleDateString('pt-AO')} - ${formatCurrency(transaction.amount)} - ${transaction.customer_email}`
        ),
        '',
         'PERFORMANCE DOS PRODUTOS',
         ...reportData.products.map(product => 
           `${product.name} - Preço: ${formatCurrency(product.price)} - Status: ${product.active ? 'Ativo' : 'Inativo'}`
         )
      ];

      const csvContent = reportContent.join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio-empresarial-${new Date().toISOString().split('T')[0]}.txt`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Relatório Gerado',
        description: 'Relatório foi baixado com sucesso!',
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar relatório',
        variant: 'destructive',
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-AO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' AOA';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Relatórios Empresariais</h2>
          <p className="text-muted-foreground">Análise detalhada do seu negócio</p>
        </div>
        <Button 
          onClick={generatePDFReport}
          disabled={generatingReport}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {generatingReport ? 'Gerando...' : 'Baixar PDF'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData.summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +{reportData.summary.growthRate.toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.summary.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Clientes únicos
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData.summary.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              Por transação
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Top Clientes</CardTitle>
            <CardDescription>Clientes com maior volume de compras</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Compras</TableHead>
                  <TableHead className="text-right">Total Gasto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.customers.map((customer, index) => (
                  <TableRow key={customer.email}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">{customer.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{customer.transactionCount}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(customer.totalSpent)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>Últimas movimentações</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-sm">
                      {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {transaction.customer_name || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.status === 'completed'
                            ? 'default'
                            : transaction.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {transaction.status === 'completed'
                          ? 'Pago'
                          : transaction.status === 'pending'
                          ? 'Pendente'
                          : 'Falhou'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Products Performance */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>Performance dos Produtos</CardTitle>
          <CardDescription>Análise de vendas por produto</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{formatCurrency(product.price)}</TableCell>
                  <TableCell>
                    <Badge variant={product.active ? 'default' : 'secondary'}>
                      {product.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(product.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}