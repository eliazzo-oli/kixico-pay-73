import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Image, Home } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function Financial() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [biFile, setBiFile] = useState<File | null>(null);
  const [nifFile, setNifFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      accountHolderName: '',
      iban: ''
    }
  });

  // Carregar dados existentes
  useEffect(() => {
    if (user) {
      loadFinancialData();
    }
  }, [user]);

  const loadFinancialData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('account_holder_name, account_number')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        form.setValue('accountHolderName', data.account_holder_name || '');
        form.setValue('iban', data.account_number || '');
      }
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'bi' | 'nif') => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === 'bi') {
        setBiFile(file);
      } else {
        setNifFile(file);
      }
    }
  };

  const onSubmit = async (data: any) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setLoading(true);

    try {
      // Upload dos arquivos se existirem
      let biUrl = null;
      let nifUrl = null;

      if (biFile) {
        const biPath = `documents/${user.id}/bi/${biFile.name}`;
        const { error: biError } = await supabase.storage
          .from('avatars')
          .upload(biPath, biFile, { upsert: true });
        
        if (biError) throw new Error(`Erro no upload do BI: ${biError.message}`);
        biUrl = biPath;
      }

      if (nifFile) {
        const nifPath = `documents/${user.id}/nif/${nifFile.name}`;
        const { error: nifError } = await supabase.storage
          .from('avatars')
          .upload(nifPath, nifFile, { upsert: true });
        
        if (nifError) throw new Error(`Erro no upload do NIF: ${nifError.message}`);
        nifUrl = nifPath;
      }

      // Atualizar dados financeiros na base de dados
      const updateData: any = {
        account_holder_name: data.accountHolderName,
        account_number: data.iban,
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error(`Erro ao salvar dados: ${updateError.message}`);
      }

      toast.success('Dados financeiros salvos com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar dados financeiros:', error);
      toast.error(error.message || 'Erro ao salvar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dados financeiros</h2>
          <p className="text-muted-foreground">
            Configure suas informações bancárias para receber os seus ganhos.
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

      <Alert className="border-primary/20 bg-primary/5">
        <AlertDescription className="text-foreground">
          Seus dados financeiros serão utilizados exclusivamente para efectuar a transferência dos seus ganhos.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="accountHolderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Titular da Conta</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome completo do titular" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="iban"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IBAN</FormLabel>
                    <FormControl>
                      <Input placeholder="PT50 0000 0000 0000 0000 0000 0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentos de Identificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Cópia do BI (Bilhete de Identidade)</Label>
                  <div className="mt-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      id="bi-upload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, 'bi')}
                      className="hidden"
                    />
                    <label htmlFor="bi-upload" className="cursor-pointer flex flex-col items-center space-y-2">
                      {biFile ? (
                        <>
                          <FileText className="w-8 h-8 text-primary" />
                          <p className="text-sm font-medium">{biFile.name}</p>
                          <p className="text-xs text-muted-foreground">Clique para alterar</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-muted-foreground" />
                          <p className="text-sm font-medium">Clique para fazer upload do BI</p>
                          <p className="text-xs text-muted-foreground">PDF, JPG, PNG até 10MB</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">NIF da Empresa (opcional)</Label>
                  <div className="mt-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      id="nif-upload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, 'nif')}
                      className="hidden"
                    />
                    <label htmlFor="nif-upload" className="cursor-pointer flex flex-col items-center space-y-2">
                      {nifFile ? (
                        <>
                          <FileText className="w-8 h-8 text-primary" />
                          <p className="text-sm font-medium">{nifFile.name}</p>
                          <p className="text-xs text-muted-foreground">Clique para alterar</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-muted-foreground" />
                          <p className="text-sm font-medium">Clique para fazer upload do NIF</p>
                          <p className="text-xs text-muted-foreground">PDF, JPG, PNG até 10MB</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Dados Financeiros'}
          </Button>
        </form>
      </Form>
    </div>
  );
}