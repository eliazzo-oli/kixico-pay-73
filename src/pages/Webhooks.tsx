import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { UserAvatar } from '@/components/UserAvatar';
import { NotificationCenter } from '@/components/NotificationCenter';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Settings, 
  Eye, 
  EyeOff, 
  Copy, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  RotateCcw
} from 'lucide-react';

import kixicoPayLogo from "/lovable-uploads/aaa7ebd4-937a-41c9-ab8e-25102e62b1ed.png";

interface WebhookEndpoint {
  id: string;
  url: string;
  secret_key: string;
  is_active: boolean;
  events: string[];
  created_at: string;
  failure_count: number;
  last_failure_at: string | null;
}

interface WebhookEvent {
  id: string;
  event_type: string;
  api_version: string;
  created_at: string;
  data: any;
}

interface WebhookAttempt {
  id: string;
  webhook_endpoint_id: string;
  webhook_event_id: string;
  http_status: number | null;
  response_body: string | null;
  error_message: string | null;
  attempt_number: number;
  succeeded: boolean;
  created_at: string;
  webhook_endpoints: WebhookEndpoint;
  webhook_events: WebhookEvent;
}

export default function Webhooks() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [attempts, setAttempts] = useState<WebhookAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newEndpointUrl, setNewEndpointUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['pagamento.sucedido']);
  const [secretVisible, setSecretVisible] = useState<Record<string, boolean>>({});

  const availableEvents = [
    { value: 'pagamento.sucedido', label: 'Pagamento Sucedido' },
    { value: 'pagamento.falhado', label: 'Pagamento Falhado' },
    { value: 'pagamento.pendente', label: 'Pagamento Pendente' },
  ];

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchWebhookData();
    }
  }, [user]);

  const fetchWebhookData = async () => {
    try {
      // Fetch endpoints
      const { data: endpointsData, error: endpointsError } = await supabase
        .from('webhook_endpoints')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (endpointsError) throw endpointsError;

      // Fetch recent attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('webhook_attempts')
        .select(`
          *,
          webhook_endpoints(*),
          webhook_events(*)
        `)
        .in('webhook_endpoint_id', endpointsData?.map(e => e.id) || [])
        .order('created_at', { ascending: false })
        .limit(50);

      if (attemptsError) throw attemptsError;

      setEndpoints(endpointsData || []);
      setAttempts(attemptsData || []);
    } catch (error) {
      console.error('Error fetching webhook data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados dos webhooks',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEndpoint = async () => {
    if (!newEndpointUrl.trim()) {
      toast({
        title: 'Erro',
        description: 'URL é obrigatória',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Generate secret key
      const { data: secretData, error: secretError } = await supabase
        .rpc('generate_webhook_secret');

      if (secretError) throw secretError;

      const { data, error } = await supabase
        .from('webhook_endpoints')
        .insert({
          user_id: user?.id,
          url: newEndpointUrl.trim(),
          secret_key: secretData,
          events: selectedEvents,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Endpoint de webhook criado com sucesso!',
      });

      setShowCreateDialog(false);
      setNewEndpointUrl('');
      setSelectedEvents(['pagamento.sucedido']);
      fetchWebhookData();
    } catch (error) {
      console.error('Error creating webhook endpoint:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar endpoint de webhook',
        variant: 'destructive',
      });
    }
  };

  const toggleEndpointStatus = async (endpointId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('webhook_endpoints')
        .update({ is_active: !isActive })
        .eq('id', endpointId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Endpoint ${!isActive ? 'ativado' : 'desativado'} com sucesso!`,
      });

      fetchWebhookData();
    } catch (error) {
      console.error('Error toggling endpoint status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status do endpoint',
        variant: 'destructive',
      });
    }
  };

  const deleteEndpoint = async (endpointId: string) => {
    try {
      const { error } = await supabase
        .from('webhook_endpoints')
        .delete()
        .eq('id', endpointId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Endpoint removido com sucesso!',
      });

      fetchWebhookData();
    } catch (error) {
      console.error('Error deleting endpoint:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover endpoint',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copiado!',
        description: `${label} copiado para a área de transferência`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao copiar para a área de transferência',
        variant: 'destructive',
      });
    }
  };

  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao fazer logout',
        variant: 'destructive',
      });
    } else {
      navigate('/');
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <button 
                  onClick={handleLogoClick}
                  className="flex items-center hover:opacity-80 transition-opacity"
                >
                  <img 
                    src={kixicoPayLogo} 
                    alt="KixicoPay" 
                    className="h-32 w-auto"
                  />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <NotificationCenter />
                <UserAvatar 
                  userId={user?.id || ''} 
                  userEmail={user?.email || ''} 
                  onSignOut={handleSignOut} 
                />
              </div>
            </div>
          </header>

          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Webhooks</h1>
                  <p className="text-muted-foreground">
                    Configure endpoints para receber notificações em tempo real sobre eventos de pagamento
                  </p>
                </div>
                
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Endpoint
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Endpoint de Webhook</DialogTitle>
                      <DialogDescription>
                        Configure um novo endpoint para receber notificações de eventos
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="url">URL do Endpoint</Label>
                        <Input
                          id="url"
                          placeholder="https://exemplo.com/webhook"
                          value={newEndpointUrl}
                          onChange={(e) => setNewEndpointUrl(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label>Eventos para Receber</Label>
                        <div className="space-y-2 mt-2">
                          {availableEvents.map((event) => (
                            <div key={event.value} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={event.value}
                                checked={selectedEvents.includes(event.value)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedEvents([...selectedEvents, event.value]);
                                  } else {
                                    setSelectedEvents(selectedEvents.filter(ev => ev !== event.value));
                                  }
                                }}
                              />
                              <Label htmlFor={event.value}>{event.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateEndpoint}>
                        Criar Endpoint
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="endpoints" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                  <TabsTrigger value="logs">Logs de Eventos</TabsTrigger>
                </TabsList>
                
                <TabsContent value="endpoints" className="space-y-6">
                  {endpoints.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nenhum endpoint configurado</h3>
                        <p className="text-muted-foreground text-center mb-6">
                          Configure seu primeiro endpoint de webhook para começar a receber notificações em tempo real
                        </p>
                        <Button onClick={() => setShowCreateDialog(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Primeiro Endpoint
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {endpoints.map((endpoint) => (
                        <Card key={endpoint.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  {endpoint.url}
                                  {endpoint.is_active ? (
                                    <Badge variant="default" className="text-xs">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Ativo
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Inativo
                                    </Badge>
                                  )}
                                  {endpoint.failure_count > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      {endpoint.failure_count} falhas
                                    </Badge>
                                  )}
                                </CardTitle>
                                <CardDescription>
                                  Criado em {new Date(endpoint.created_at).toLocaleDateString('pt-BR')}
                                  {endpoint.last_failure_at && (
                                    <span className="text-destructive ml-2">
                                      • Última falha: {new Date(endpoint.last_failure_at).toLocaleString('pt-BR')}
                                    </span>
                                  )}
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={endpoint.is_active}
                                  onCheckedChange={() => toggleEndpointStatus(endpoint.id, endpoint.is_active)}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteEndpoint(endpoint.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium">Eventos:</Label>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {endpoint.events.map((event) => (
                                  <Badge key={event} variant="outline" className="text-xs">
                                    {availableEvents.find(e => e.value === event)?.label || event}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-sm font-medium">Chave Secreta:</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Input
                                  type={secretVisible[endpoint.id] ? 'text' : 'password'}
                                  value={endpoint.secret_key}
                                  readOnly
                                  className="font-mono text-sm"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSecretVisible({
                                    ...secretVisible,
                                    [endpoint.id]: !secretVisible[endpoint.id]
                                  })}
                                >
                                  {secretVisible[endpoint.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(endpoint.secret_key, 'Chave secreta')}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="logs" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Logs de Tentativas de Webhook</CardTitle>
                      <CardDescription>
                        Histórico das últimas tentativas de entrega de webhooks
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {attempts.length === 0 ? (
                        <div className="text-center py-8">
                          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">Nenhuma tentativa de webhook registrada</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data/Hora</TableHead>
                              <TableHead>Endpoint</TableHead>
                              <TableHead>Evento</TableHead>
                              <TableHead>Tentativa</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Resposta</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attempts.map((attempt) => (
                              <TableRow key={attempt.id}>
                                <TableCell className="text-sm">
                                  {new Date(attempt.created_at).toLocaleString('pt-BR')}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {attempt.webhook_endpoints?.url || 'N/A'}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {attempt.webhook_events?.event_type || 'N/A'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                  #{attempt.attempt_number}
                                </TableCell>
                                <TableCell>
                                  {attempt.succeeded ? (
                                    <Badge variant="default" className="text-xs">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Sucesso
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive" className="text-xs">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Falha
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {attempt.http_status ? (
                                    <span className={attempt.http_status >= 200 && attempt.http_status < 300 ? 'text-green-600' : 'text-red-600'}>
                                      HTTP {attempt.http_status}
                                    </span>
                                  ) : (
                                    <span className="text-red-600">
                                      {attempt.error_message?.substring(0, 50) || 'Erro de conexão'}
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}