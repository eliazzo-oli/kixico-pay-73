import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrialBanner } from '@/components/TrialBanner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Users, Search, Download, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Member {
  id: string;
  customer_name: string;
  customer_email: string;
  product_name: string;
  created_at: string;
  status: string;
}

export default function MembersArea() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [user]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          customer_name,
          customer_email,
          created_at,
          status,
          products:product_id (name)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedMembers = (data || []).map((t: any) => ({
        id: t.id,
        customer_name: t.customer_name || 'Cliente',
        customer_email: t.customer_email,
        product_name: t.products?.name || 'Produto',
        created_at: t.created_at,
        status: t.status,
      }));

      setMembers(formattedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <TrialBanner />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Área de Membros
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os alunos e clientes que compraram seus produtos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Alunos & Clientes</CardTitle>
              <CardDescription>
                {members.length} {members.length === 1 ? 'membro' : 'membros'} no total
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
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-foreground mb-1">Nenhum membro encontrado</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'Tente outro termo de pesquisa' : 'Seus clientes aparecerão aqui após a primeira venda'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Produto/Curso</TableHead>
                    <TableHead>Data de Compra</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{member.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{member.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.product_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(member.created_at), "dd MMM yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                          Ativo
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
