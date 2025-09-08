import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function Wallet() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserBalance() {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('balance')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Erro ao buscar saldo:', error);
          toast({
            title: "Erro ao carregar saldo",
            description: "Não foi possível carregar seu saldo atual.",
            variant: "destructive",
          });
          return;
        }

        // Se o saldo for null ou undefined, usar 0
        setBalance(data?.balance || 0);
      } catch (error) {
        console.error('Erro ao buscar saldo:', error);
        setBalance(0);
      } finally {
        setLoading(false);
      }
    }

    fetchUserBalance();
  }, [user?.id, toast]);

  const formatPrice = (value: number) => {
    console.log('Formatando valor:', value); // Debug log
    return value.toLocaleString('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' AOA';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando saldo...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Carteira</h2>
          <p className="text-muted-foreground">
            Acompanhe seu saldo e histórico de transações.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          Voltar ao início
        </Button>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Saldo total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatPrice(balance)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Inclui valores bloqueados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Disponível para saque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {formatPrice(balance)}
            </div>
            <Button 
              className="mt-4 w-full"
              onClick={() => {
                console.log('Botão clicado, redirecionando para /dashboard/withdrawals');
                navigate('/dashboard/withdrawals');
              }}
            >
              Solicitar saque
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma transação encontrada.</p>
            <p className="text-sm mt-2">Suas transações aparecerão aqui quando forem processadas.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}