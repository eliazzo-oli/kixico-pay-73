import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Home, Wallet as WalletIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface WalletBalance {
  currency: 'AOA' | 'BRL';
  balance: number;
}

export default function Wallet() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWallets() {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('wallets')
          .select('currency, balance')
          .eq('user_id', user.id)
          .order('currency', { ascending: true });

        if (error) {
          console.error('Erro ao buscar carteiras:', error);
          toast({
            title: "Erro ao carregar saldos",
            description: "Não foi possível carregar seus saldos.",
            variant: "destructive",
          });
          return;
        }

        setWallets((data || []) as WalletBalance[]);
      } catch (error) {
        console.error('Erro ao buscar carteiras:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchWallets();
  }, [user?.id, toast]);

  const formatPrice = (value: number, currency: string) => {
    const formatted = value.toLocaleString('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${formatted} ${currency}`;
  };

  const getCurrencyName = (currency: string) => {
    return currency === 'AOA' ? 'Kwanza Angolano' : 'Real Brasileiro';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando saldos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Carteira</h2>
          <p className="text-muted-foreground">
            Acompanhe seus saldos em diferentes moedas.
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

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <WalletIcon className="w-5 h-5" />
            Minhas Carteiras
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {wallets.map((wallet) => (
              <Card key={wallet.currency} className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{getCurrencyName(wallet.currency)}</span>
                    <Badge variant="outline">{wallet.currency}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-4">
                    {formatPrice(wallet.balance, wallet.currency)}
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => navigate('/dashboard/withdrawals', { state: { selectedCurrency: wallet.currency } })}
                  >
                    Solicitar saque em {wallet.currency}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
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
    </div>
  );
}
