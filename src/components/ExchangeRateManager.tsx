import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExchangeRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  updated_at: string;
}

export function ExchangeRateManager() {
  const { toast } = useToast();
  const [rate, setRate] = useState<ExchangeRate | null>(null);
  const [newRate, setNewRate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRate();
  }, []);

  const fetchRate = async () => {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('from_currency', 'BRL')
        .eq('to_currency', 'AOA')
        .single();

      if (error) throw error;
      
      setRate(data as ExchangeRate);
      setNewRate(data.rate.toString());
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a taxa de câmbio.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const numRate = Number(newRate);
    
    if (!numRate || numRate <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Insira uma taxa de câmbio válida.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('exchange_rates')
        .update({ 
          rate: numRate,
          updated_at: new Date().toISOString()
        })
        .eq('from_currency', 'BRL')
        .eq('to_currency', 'AOA');

      if (error) throw error;

      toast({
        title: 'Taxa atualizada',
        description: `Nova taxa: 1 BRL = ${numRate} AOA`,
      });

      fetchRate();
    } catch (error) {
      console.error('Error updating exchange rate:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a taxa de câmbio.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50 shadow-lg">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <RefreshCw className="w-5 h-5" />
          Gestão de Câmbio
        </CardTitle>
        <CardDescription>
          Configure a taxa de conversão entre BRL e AOA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Rate Display */}
        <div className="bg-primary/10 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">Taxa Atual</p>
          <p className="text-2xl font-bold text-primary">
            1 BRL = {rate?.rate.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} AOA
          </p>
          {rate?.updated_at && (
            <p className="text-xs text-muted-foreground mt-1">
              Última atualização: {new Date(rate.updated_at).toLocaleDateString('pt-PT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>

        {/* Update Rate Form */}
        <div className="space-y-3">
          <Label htmlFor="newRate">Nova Taxa (AOA por 1 BRL)</Label>
          <div className="flex gap-2">
            <Input
              id="newRate"
              type="number"
              min="0"
              step="0.01"
              placeholder="150.00"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              disabled={saving}
            />
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Esta taxa será usada para todas as conversões de BRL para AOA na plataforma.
          </p>
        </div>

        {/* Preview */}
        {newRate && Number(newRate) > 0 && Number(newRate) !== rate?.rate && (
          <div className="bg-accent/50 p-3 rounded-lg">
            <p className="text-sm font-medium">Prévia da nova taxa:</p>
            <p className="text-sm">
              R$ 100,00 = {(100 * Number(newRate)).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} Kz
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
