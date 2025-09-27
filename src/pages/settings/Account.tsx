import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, User, Save, Key, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AccountData {
  name: string;
  email: string;
  phone: string;
  fantasy_name: string;
  avatar_url?: string;
}

export default function Account() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [accountData, setAccountData] = useState<AccountData>({
    name: '',
    email: '',
    phone: '',
    fantasy_name: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAccountData();
    }
  }, [user]);

  const fetchAccountData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setAccountData({
          name: data.name || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          fantasy_name: data.fantasy_name || '',
          avatar_url: data.avatar_url || '',
        });
      } else {
        setAccountData(prev => ({
          ...prev,
          email: user?.email || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching account data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados da conta',
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
        description: 'Erro ao fazer upload da foto',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      let avatarUrl = accountData.avatar_url;

      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      // Verificar se o perfil já existe
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      let error;

      if (existingProfile) {
        // Atualizar perfil existente
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            name: accountData.name,
            email: accountData.email,
            phone: accountData.phone,
            fantasy_name: accountData.fantasy_name,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user?.id);
        
        error = updateError;
      } else {
        // Criar novo perfil
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user?.id,
            name: accountData.name,
            email: accountData.email,
            phone: accountData.phone,
            fantasy_name: accountData.fantasy_name,
            avatar_url: avatarUrl,
          });
        
        error = insertError;
      }

      if (error) throw error;

      setAccountData(prev => ({ ...prev, avatar_url: avatarUrl }));
      setAvatarFile(null);

      // Força atualização do avatar em outros componentes
      window.dispatchEvent(new Event('focus'));

      toast({
        title: 'Sucesso',
        description: 'Dados salvos com sucesso!',
      });
    } catch (error) {
      console.error('Error saving account data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar alterações',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof AccountData, value: string) => {
    setAccountData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'A confirmação da senha não confere',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A nova senha deve ter pelo menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordForm(false);

      toast({
        title: 'Sucesso',
        description: 'Senha alterada com sucesso!',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar a senha',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePasswordInputChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Minha conta</h2>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Minha conta</h2>
          <p className="text-muted-foreground">
            Configure seus dados pessoais e preferências da conta.
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

      <div className="grid gap-6">
        {/* Foto do Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Foto do Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={avatarFile ? URL.createObjectURL(avatarFile) : accountData.avatar_url} 
                  alt="Foto do perfil" 
                />
                <AvatarFallback className="text-2xl">
                  {accountData.name ? accountData.name.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('avatar')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Alterar Foto
                </Button>
                {avatarFile && (
                  <p className="text-sm text-muted-foreground">
                    {avatarFile.name}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo (conforme documento)</Label>
              <Input
                id="fullName"
                value={accountData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Digite seu nome completo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fantasyName">Nome Fantasia</Label>
              <Input
                id="fantasyName"
                value={accountData.fantasy_name}
                onChange={(e) => handleInputChange('fantasy_name', e.target.value)}
                placeholder="Digite seu nome fantasia"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Endereço de E-mail</Label>
              <Input
                id="email"
                type="email"
                value={accountData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Digite seu email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Número de Telefone</Label>
              <Input
                id="phone"
                value={accountData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveChanges} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
              >
                <Key className="h-4 w-4 mr-2" />
                Alterar Senha
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Alteração de Senha */}
        {showPasswordForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Alterar Senha
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                  placeholder="Digite sua nova senha"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirme sua nova senha"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handlePasswordChange} 
                  disabled={isChangingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isChangingPassword ? 'Alterando...' : 'Salvar Nova Senha'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}