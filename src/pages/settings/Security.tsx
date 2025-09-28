import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TwoFactorSettings from '@/components/TwoFactorSettings';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function Security() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_two_factor_enabled')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Segurança</h1>
          <p className="text-muted-foreground">
            Gerir as configurações de segurança da sua conta
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Segurança</h1>
          <p className="text-muted-foreground">
            Gerir as configurações de segurança da sua conta
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Erro ao carregar configurações de segurança
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Segurança</h1>
        <p className="text-muted-foreground">
          Gerir as configurações de segurança da sua conta
        </p>
      </div>

      <TwoFactorSettings 
        profile={profile} 
        onUpdate={fetchProfile}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Outras Configurações de Segurança
          </CardTitle>
          <CardDescription>
            Configurações adicionais para proteger a sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Alterar palavra-passe</p>
                <p className="text-sm text-muted-foreground">
                  Actualize a sua palavra-passe regularmente
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Disponível em breve
              </p>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Sessões ativas</p>
                <p className="text-sm text-muted-foreground">
                  Veja e gerir dispositivos conectados
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Disponível em breve
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}