import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Home, ArrowRightLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Wallet {
  currency: string;
  balance: number;
}

export default function Wallet() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallets, setWallets] = useState<Wallet[]>([]);
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

        setWallets(data || []);
      } catch (error) {
        console.error('Erro ao buscar carteiras:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchWallets();
  }, [user?.id, toast]);

  const formatPrice = (value: number, currency: string) => {
    return value.toLocaleString('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' ' + currency;
  };

  const getCurrencyName = (currency: string) => {
    return currency === 'AOA' ? 'Kwanza Angolano' : 'Real Brasileiro';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando saldo...</div>
      </div>
    );
  }

  const aoaWallet = wallets.find(w => w.currency === 'AOA');
  const brlWallet = wallets.find(w => w.currency === 'BRL');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Minhas Carteiras</h2>
          <p className="text-muted-foreground">
            Gerencie seus saldos em AOA e BRL separadamente.
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
        {/* Carteira AOA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>💰 Carteira AOA</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">{getCurrencyName('AOA')}</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-4">
              {formatPrice(aoaWallet?.balance || 0, 'AOA')}
            </div>
            <Button 
              className="w-full"
              onClick={() => navigate('/dashboard/withdrawals', { state: { currency: 'AOA' } })}
            >
              Solicitar saque em AOA
            </Button>
          </CardContent>
        </Card>

        {/* Carteira BRL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>🇧🇷 Carteira BRL</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">{getCurrencyName('BRL')}</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-4">
              {formatPrice(brlWallet?.balance || 0, 'BRL')}
            </div>
            <div className="space-y-2">
              <Button 
                className="w-full"
                onClick={() => navigate('/dashboard/withdrawals', { state: { currency: 'BRL' } })}
              >
                Solicitar saque em BRL
              </Button>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => {
                  toast({
                    title: "Câmbio em breve",
                    description: "A funcionalidade de conversão BRL → AOA estará disponível em breve.",
                  });
                }}
              >
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Converter para AOA
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Como funciona?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>Vendas em AOA</strong> creditam automaticamente na sua Carteira AOA</p>
          <p>• <strong>Vendas em BRL</strong> creditam automaticamente na sua Carteira BRL</p>
          <p>• Você pode sacar de cada carteira separadamente</p>
          <p>• Em breve: converta saldo BRL para AOA com taxas competitivas</p>
        </CardContent>
      </Card>
    </div>
  );
}