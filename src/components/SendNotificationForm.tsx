import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Send, Users, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  user_id: string;
  name: string;
  email: string;
}

export function SendNotificationForm() {
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, name, email')
          .order('name');

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar a lista de usuários',
          variant: 'destructive',
        });
      } finally {
        setLoadingUsers(false);
      }
    }

    fetchUsers();
  }, [toast]);

  const handleSendNotification = async () => {
    if (!message.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, digite uma mensagem',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      if (selectedUser === 'all') {
        // Send notification to all users (user_id = null)
        const { error } = await supabase
          .from('notifications')
          .insert({
            message: message.trim(),
            sender: 'Administrador',
            user_id: null,
          });

        if (error) throw error;
      } else {
        // Send notification to specific user
        const { error } = await supabase
          .from('notifications')
          .insert({
            message: message.trim(),
            sender: 'Administrador',
            user_id: selectedUser,
          });

        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: `Notificação enviada ${selectedUser === 'all' ? 'para todos os usuários' : 'para o usuário selecionado'}`,
      });

      setMessage('');
      setSelectedUser('all');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a notificação',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Enviar Notificação
        </CardTitle>
        <CardDescription>
          Envie notificações para usuários específicos ou para todos os usuários
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipient">Destinatário</Label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o destinatário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Todos os usuários
                </div>
              </SelectItem>
              {loadingUsers ? (
                <SelectItem value="loading" disabled>
                  Carregando usuários...
                </SelectItem>
              ) : (
                users.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Mensagem</Label>
          <Textarea
            id="message"
            placeholder="Digite sua mensagem aqui..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        <Button
          onClick={handleSendNotification}
          disabled={loading || !message.trim()}
          className="w-full"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background"></div>
              Enviando...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Enviar Notificação
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}