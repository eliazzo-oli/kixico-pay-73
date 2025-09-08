import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TrialBanner } from '@/components/TrialBanner';
import { ArrowLeft, User, CreditCard, Upload, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Profile {
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  bank_name?: string;
  account_number?: string;
  account_holder_name?: string;
  digital_wallet_type?: string;
  digital_wallet_identifier?: string;
}

export default function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>({
    name: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
          bank_name: data.bank_name || '',
          account_number: data.account_number || '',
          account_holder_name: data.account_holder_name || '',
          digital_wallet_type: data.digital_wallet_type || '',
          digital_wallet_identifier: data.digital_wallet_identifier || '',
        });
      } else {
        // Create profile if doesn't exist
        setProfile({
          name: user?.user_metadata?.name || '',
          email: user?.email || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar perfil',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao fazer upload da imagem',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let avatarUrl = profile.avatar_url;

      // Upload new avatar if selected
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user?.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          avatar_url: avatarUrl,
          bank_name: profile.bank_name,
          account_number: profile.account_number,
          account_holder_name: profile.account_holder_name,
          digital_wallet_type: profile.digital_wallet_type,
          digital_wallet_identifier: profile.digital_wallet_identifier,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
      setAvatarFile(null);
      
      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso!',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar perfil',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof Profile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
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
                <h1 className="text-2xl font-bold text-primary">
                  Perfil
                </h1>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
            <TrialBanner />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Informações Pessoais */}
              <Card className="border-border/50 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <CardTitle>Informações Pessoais</CardTitle>
                  </div>
                  <CardDescription>
                    Atualize suas informações básicas e foto de perfil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar */}
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Foto de Perfil</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {profile.avatar_url ? (
                          <img 
                            src={profile.avatar_url} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Input
                          id="avatar"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('avatar')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Alterar Foto
                        </Button>
                        {avatarFile && (
                          <span className="text-sm text-muted-foreground">
                            {avatarFile.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nome */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Digite seu nome completo"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Digite seu email"
                    />
                  </div>

                  {/* Telefone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={profile.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Digite seu telefone"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Formas de Pagamento */}
              <Card className="border-border/50 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <CardTitle>Formas de Pagamento</CardTitle>
                  </div>
                  <CardDescription>
                    Configure suas informações bancárias para receber pagamentos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Informações Bancárias */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">Conta Bancária</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bank_name">Nome do Banco</Label>
                      <Input
                        id="bank_name"
                        value={profile.bank_name || ''}
                        onChange={(e) => handleInputChange('bank_name', e.target.value)}
                        placeholder="Ex: Banco BAI"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account_holder_name">Nome do Titular</Label>
                      <Input
                        id="account_holder_name"
                        value={profile.account_holder_name || ''}
                        onChange={(e) => handleInputChange('account_holder_name', e.target.value)}
                        placeholder="Nome do titular da conta"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account_number">Número da Conta</Label>
                      <Input
                        id="account_number"
                        value={profile.account_number || ''}
                        onChange={(e) => handleInputChange('account_number', e.target.value)}
                        placeholder="Digite o número da conta"
                      />
                    </div>
                  </div>

                  {/* Carteira Digital */}
                  <div className="space-y-4 border-t border-border pt-6">
                    <h4 className="font-medium text-foreground">Carteira Digital</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="digital_wallet_type">Tipo de Carteira</Label>
                      <Select
                        value={profile.digital_wallet_type || ''}
                        onValueChange={(value) => handleInputChange('digital_wallet_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de carteira" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multicaixa">Multicaixa Express</SelectItem>
                          <SelectItem value="unitel">Unitel Money</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="digital_wallet_identifier">Identificador da Carteira</Label>
                      <Input
                        id="digital_wallet_identifier"
                        value={profile.digital_wallet_identifier || ''}
                        onChange={(e) => handleInputChange('digital_wallet_identifier', e.target.value)}
                        placeholder="Email, telefone ou ID da carteira"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <Button onClick={handleSave} disabled={isSaving} size="lg">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}