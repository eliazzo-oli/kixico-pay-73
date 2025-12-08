import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrialBanner } from '@/components/TrialBanner';
import { RotateCcw, Search, AlertCircle } from 'lucide-react';

interface Refund {
  id: string;
  transaction_id: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function Refunds() {
  const [refunds] = useState<Refund[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Aprovado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pendente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Rejeitado</Badge>;
      default:
        return null;
    }
  };

  const filteredRefunds = refunds.filter(
    (r) =>
      r.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <TrialBanner />
      
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <RotateCcw className="h-6 w-6 text-primary" />
          Reembolsos
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie solicitações de reembolso dos seus clientes
        </p>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Solicitações de Reembolso</CardTitle>
              <CardDescription>
                {refunds.length} {refunds.length === 1 ? 'solicitação' : 'solicitações'} no total
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRefunds.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-medium text-foreground mb-1">Nenhum reembolso</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Ainda não há solicitações de reembolso. Quando um cliente solicitar, aparecerá aqui.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Transação</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRefunds.map((refund) => (
                    <TableRow key={refund.id}>
                      <TableCell className="font-mono text-xs">
                        {refund.transaction_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{refund.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{refund.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {refund.amount.toLocaleString('pt-AO')} {refund.currency}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                        {refund.reason}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(refund.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Política de Reembolsos</p>
              <p className="text-xs text-muted-foreground mt-1">
                Os reembolsos são processados automaticamente de acordo com a política de garantia configurada em cada produto. 
                Para produtos digitais, a política padrão é de 7 dias.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
