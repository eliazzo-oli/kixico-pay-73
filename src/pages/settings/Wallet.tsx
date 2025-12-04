import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Home, Wallet as WalletIcon, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CurrencyConversionModal } from '@/components/CurrencyConversionModal';

interface WalletBalance {
  currency: 'AOA' | 'BRL';
  balance: number;
}

interface ConversionHistory {
  id: string;
  from_currency: string;
  to_currency: string;
  from_amount: number;
  to_amount: number;
  exchange_rate: number;
  created_at: string;
}

export default function Wallet() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [conversions, setConversions] = useState<ConversionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConversionModal, setShowConversionModal] = useState(false);

  const fetchData = async () => {
    if (!user?.id) return;
    
    try {
      // Fetch wallets
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('currency, balance')
        .eq('user_id', user.id)
        .order('currency', { ascending: true });

      if (walletsError) {
        console.error('Erro ao buscar carteiras:', walletsError);
        toast({
          title: "Erro ao carregar saldos",
          description: "Não foi possível carregar seus saldos.",
          variant: "destructive",
        });
        return;
      }

      setWallets((walletsData || []) as WalletBalance[]);

      // Fetch conversion history
      const { data: conversionsData, error: conversionsError } = await supabase
        .from('currency_conversions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!conversionsError && conversionsData) {
        setConversions(conversionsData as ConversionHistory[]);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  const brlWallet = wallets.find(w => w.currency === 'BRL');
  const brlBalance = brlWallet?.balance || 0;

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
                  <div className="flex flex-col gap-2">
                    <Button 
                      className="w-full"
                      onClick={() => navigate('/dashboard/withdrawals', { state: { selectedCurrency: wallet.currency } })}
                    >
                      Solicitar saque em {wallet.currency}
                    </Button>
                    {wallet.currency === 'BRL' && (
                      <Button 
                        variant="secondary"
                        className="w-full flex items-center gap-2"
                        onClick={() => setShowConversionModal(true)}
                        disabled={wallet.balance <= 0}
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                        Converter para Kz
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Histórico de Conversões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conversions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma conversão realizada.</p>
                <p className="text-sm mt-2">Suas conversões de moeda aparecerão aqui.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversions.map((conversion) => (
                  <div 
                    key={conversion.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {formatPrice(conversion.from_amount, conversion.from_currency)} → {formatPrice(conversion.to_amount, conversion.to_currency === 'AOA' ? 'Kz' : conversion.to_currency)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Taxa: 1 {conversion.from_currency} = {conversion.exchange_rate} {conversion.to_currency}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="bg-green-500/10 text-green-600">
                        Concluída
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(conversion.created_at).toLocaleDateString('pt-PT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CurrencyConversionModal
        open={showConversionModal}
        onOpenChange={setShowConversionModal}
        brlBalance={brlBalance}
        onConversionComplete={fetchData}
      />
    </div>
  );
}