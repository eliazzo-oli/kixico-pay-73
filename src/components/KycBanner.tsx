import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function KycBanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const fetchKycStatus = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('kyc_status')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setKycStatus(profile.kyc_status);
        setShowBanner(profile.kyc_status === 'nao_verificado' || profile.kyc_status === 'rejeitado');
      }
    };

    fetchKycStatus();
  }, [user]);

  if (!showBanner || !kycStatus) return null;

  return (
    <Alert className="border-destructive bg-destructive/10 text-destructive mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between w-full">
        <span className="font-medium">
          Atenção: Você precisa verificar a sua identidade para realizar vendas e processar saques!
        </span>
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => navigate('/configuracoes/verificacao')}
          >
            Verificar Agora
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBanner(false)}
            className="text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}