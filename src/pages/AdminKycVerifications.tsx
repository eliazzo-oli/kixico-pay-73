import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAdmin } from '@/hooks/useAdmin';

interface KycUser {
  user_id: string;
  name: string;
  email: string;
  kyc_status: string;
  kyc_submitted_at: string;
  kyc_reviewed_at?: string;
  id_front_url?: string;
  id_back_url?: string;
  selfie_url?: string;
  kyc_rejection_reason?: string;
}

export default function AdminKycVerifications() {
  const { isAdmin } = useAdmin();
  const [users, setUsers] = useState<KycUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<KycUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<KycUser | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  useEffect(() => {
    if (isAdmin) {
      fetchKycUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter]);

  const fetchKycUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, email, kyc_status, created_at')
        .in('kyc_status', ['pendente', 'verificado', 'rejeitado'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map data to interface
      const mappedUsers: KycUser[] = (data || []).map(profile => ({
        user_id: profile.user_id,
        name: profile.name || '',
        email: profile.email || '',
        kyc_status: profile.kyc_status || 'nao_verificado',
        kyc_submitted_at: profile.created_at,
      }));
      
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching KYC users:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as verificações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'todos') {
      filtered = filtered.filter(user => user.kyc_status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Em Análise</Badge>;
      case 'verificado':
        return <Badge variant="default" className="bg-green-500">Verificado</Badge>;
      case 'rejeitado':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const handleReview = async () => {
    if (!selectedUser || !reviewAction) return;

    try {
      const updateData: any = {
        kyc_status: reviewAction === 'approve' ? 'verificado' : 'rejeitado',
        kyc_reviewed_at: new Date().toISOString(),
      };

      if (reviewAction === 'reject' && rejectionReason) {
        updateData.kyc_rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', selectedUser.user_id);

      if (error) throw error;

      // Send email notification
      try {
        const { error: emailError } = await supabase.functions.invoke('send-kyc-notification', {
          body: {
            to: selectedUser.email,
            userName: selectedUser.name,
            status: reviewAction === 'approve' ? 'approved' : 'rejected',
            rejectionReason: reviewAction === 'reject' ? rejectionReason : undefined,
          }
        });

        if (emailError) {
          console.error('Error sending KYC notification email:', emailError);
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }

      toast({
        title: "Verificação atualizada",
        description: `Status alterado para ${reviewAction === 'approve' ? 'verificado' : 'rejeitado'}.`,
      });

      // Refresh data
      await fetchKycUsers();
      setShowReviewDialog(false);
      setSelectedUser(null);
      setReviewAction(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error updating KYC status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const getImageUrl = async (path: string) => {
    if (!path) return '';
    
    const { data } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(path);
    
    return data.publicUrl;
  };

  const openReviewDialog = (user: KycUser, action: 'approve' | 'reject') => {
    setSelectedUser(user);
    setReviewAction(action);
    setShowReviewDialog(true);
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p>Acesso negado. Esta página é apenas para administradores.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Verificações KYC</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as verificações de identidade dos usuários
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar por nome ou email</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Digite para buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="status-filter">Filtrar por status</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="todos">Todos</option>
                <option value="pendente">Em Análise</option>
                <option value="verificado">Verificado</option>
                <option value="rejeitado">Rejeitado</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle>Verificações ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Envio</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getStatusBadge(user.kyc_status)}</TableCell>
                  <TableCell>
                    {new Date(user.kyc_submitted_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      {user.kyc_status === 'pendente' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openReviewDialog(user, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openReviewDialog(user, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma verificação encontrada
            </div>
          )}
        </CardContent>
      </Card>

      {/* User details dialog */}
      <Dialog open={selectedUser !== null && !showReviewDialog} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Verificação - {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <p className="font-medium">{selectedUser.name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedUser.kyc_status)}</div>
                </div>
                <div>
                  <Label>Data de Envio</Label>
                  <p className="font-medium">
                    {new Date(selectedUser.kyc_submitted_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {selectedUser.kyc_rejection_reason && (
                <div>
                  <Label>Motivo da Rejeição</Label>
                  <p className="font-medium text-destructive">{selectedUser.kyc_rejection_reason}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedUser.id_front_url && (
                  <div>
                    <Label>Frente do BI</Label>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <img 
                        src={`https://tumanpeywddnixgyfale.supabase.co/storage/v1/object/public/kyc-documents/${selectedUser.id_front_url}`}
                        alt="Frente do BI"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  </div>
                )}
                
                {selectedUser.id_back_url && (
                  <div>
                    <Label>Verso do BI</Label>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <img 
                        src={`https://tumanpeywddnixgyfale.supabase.co/storage/v1/object/public/kyc-documents/${selectedUser.id_back_url}`}
                        alt="Verso do BI"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  </div>
                )}
                
                {selectedUser.selfie_url && (
                  <div>
                    <Label>Selfie</Label>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <img 
                        src={`https://tumanpeywddnixgyfale.supabase.co/storage/v1/object/public/kyc-documents/${selectedUser.selfie_url}`}
                        alt="Selfie"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              {selectedUser.kyc_status === 'pendente' && (
                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={() => openReviewDialog(selectedUser, 'approve')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => openReviewDialog(selectedUser, 'reject')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Aprovar' : 'Rejeitar'} Verificação
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Tem certeza que deseja {reviewAction === 'approve' ? 'aprovar' : 'rejeitar'} a verificação de {selectedUser?.name}?
            </p>
            
            {reviewAction === 'reject' && (
              <div>
                <Label htmlFor="rejection-reason">Motivo da rejeição</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Descreva o motivo da rejeição..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-2"
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowReviewDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReview}
                variant={reviewAction === 'approve' ? 'default' : 'destructive'}
                disabled={reviewAction === 'reject' && !rejectionReason.trim()}
              >
                {reviewAction === 'approve' ? 'Aprovar' : 'Rejeitar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}