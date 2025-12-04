import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CurrencyConversionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brlBalance: number;
  onConversionComplete: () => void;
}

export function CurrencyConversionModal({
  open,
  onOpenChange,
  brlBalance,
  onConversionComplete,
}: CurrencyConversionModalProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRate, setLoadingRate] = useState(true);

  useEffect(() => {
    if (open) {
      fetchExchangeRate();
      setAmount('');
    }
  }, [open]);

  const fetchExchangeRate = async () => {
    setLoadingRate(true);
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', 'BRL')
        .eq('to_currency', 'AOA')
        .single();

      if (error) throw error;
      setExchangeRate(Number(data.rate));
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível obter a taxa de câmbio.',
        variant: 'destructive',
      });
    } finally {
      setLoadingRate(false);
    }
  };

  const convertedAmount = amount && exchangeRate 
    ? Number(amount) * exchangeRate 
    : 0;

  const handleConvert = async () => {
    const numAmount = Number(amount);
    
    if (!numAmount || numAmount <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Insira um valor válido para conversão.',
        variant: 'destructive',
      });
      return;
    }

    if (numAmount > brlBalance) {
      toast({
        title: 'Saldo insuficiente',
        description: 'Você não tem saldo suficiente em BRL.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      const response = await supabase.functions.invoke('convert-currency', {
        body: {
          amount: numAmount,
          from_currency: 'BRL',
          to_currency: 'AOA',
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro na conversão');
      }

      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.error || 'Erro na conversão');
      }

      toast({
        title: 'Conversão realizada!',
        description: `R$ ${numAmount.toFixed(2)} convertidos para ${result.to_amount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} Kz`,
      });

      onConversionComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Conversion error:', error);
      toast({
        title: 'Erro na conversão',
        description: error.message || 'Não foi possível realizar a conversão.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    return value.toLocaleString('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' ' + currency;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Converter Saldo BRL para AOA
          </DialogTitle>
          <DialogDescription>
            Converta seu saldo em Reais para Kwanzas angolanos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Available Balance */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Saldo disponível em BRL</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(brlBalance, 'BRL')}
            </p>
          </div>

          {/* Exchange Rate */}
          <div className="bg-accent/50 p-3 rounded-lg flex items-center justify-between">
            <span className="text-sm">Cotação de hoje:</span>
            {loadingRate ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="font-semibold">
                R$ 1,00 = {exchangeRate?.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} Kz
              </span>
            )}
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor a converter (BRL)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              max={brlBalance}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading || loadingRate}
            />
          </div>

          {/* Conversion Preview */}
          {amount && Number(amount) > 0 && exchangeRate && (
            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Você envia</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(Number(amount), 'BRL')}
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-primary" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Você recebe</p>
                  <p className="text-lg font-semibold text-primary">
                    {formatCurrency(convertedAmount, 'Kz')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning for insufficient balance */}
          {amount && Number(amount) > brlBalance && (
            <p className="text-sm text-destructive">
              Saldo insuficiente para esta conversão.
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={handleConvert}
            disabled={
              loading || 
              loadingRate || 
              !amount || 
              Number(amount) <= 0 || 
              Number(amount) > brlBalance
            }
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Convertendo...
              </>
            ) : (
              'Confirmar Conversão'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
