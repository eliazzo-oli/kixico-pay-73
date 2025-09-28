import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

type KycStatus = 'nao_verificado' | 'pendente' | 'verificado' | 'rejeitado';

interface KycData {
  kyc_status: KycStatus;
  id_front_url?: string;
  id_back_url?: string;
  selfie_url?: string;
  kyc_submitted_at?: string;
  kyc_reviewed_at?: string;
  kyc_rejection_reason?: string;
}

export default function KycVerification() {
  const { user } = useAuth();
  const [kycData, setKycData] = useState<KycData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState({
    idFront: null as File | null,
    idBack: null as File | null,
    selfie: null as File | null,
  });

  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchKycData();
  }, [user]);

  const fetchKycData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('kyc_status, id_front_url, id_back_url, selfie_url, kyc_submitted_at, kyc_reviewed_at, kyc_rejection_reason')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setKycData(data as KycData);
    } catch (error) {
      console.error('Error fetching KYC data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de verificação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (type: 'idFront' | 'idBack' | 'selfie', file: File | null) => {
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        toast({
          title: "Formato inválido",
          description: "Apenas arquivos JPG, PNG ou PDF são permitidos.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > maxSize) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }
    }

    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const uploadFile = async (file: File, type: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user!.id}/${type}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('kyc-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    return fileName;
  };

  const handleSubmit = async () => {
    if (!user || !files.idFront || !files.idBack || !files.selfie) {
      toast({
        title: "Documentos incompletos",
        description: "Por favor, anexe todos os documentos necessários.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload all files
      const [idFrontUrl, idBackUrl, selfieUrl] = await Promise.all([
        uploadFile(files.idFront, 'id_front'),
        uploadFile(files.idBack, 'id_back'),
        uploadFile(files.selfie, 'selfie'),
      ]);

      // Update profile with URLs and status
      const { error } = await supabase
        .from('profiles')
        .update({
          kyc_status: 'pendente',
          id_front_url: idFrontUrl,
          id_back_url: idBackUrl,
          selfie_url: selfieUrl,
          kyc_submitted_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Documentos enviados com sucesso!",
        description: "A sua conta está em análise. Você será notificado sobre o resultado.",
      });

      // Refresh data
      await fetchKycData();
    } catch (error) {
      console.error('Error submitting KYC:', error);
      toast({
        title: "Erro no envio",
        description: "Não foi possível enviar os documentos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusInfo = (status: KycStatus) => {
    switch (status) {
      case 'nao_verificado':
        return {
          badge: <Badge variant="secondary">Não Verificado</Badge>,
          color: 'text-muted-foreground',
          icon: <AlertTriangle className="h-4 w-4" />
        };
      case 'pendente':
        return {
          badge: <Badge variant="outline" className="border-yellow-500 text-yellow-700">Em Análise</Badge>,
          color: 'text-yellow-700',
          icon: <Clock className="h-4 w-4" />
        };
      case 'verificado':
        return {
          badge: <Badge variant="default" className="bg-green-500">Verificado</Badge>,
          color: 'text-green-700',
          icon: <CheckCircle className="h-4 w-4" />
        };
      case 'rejeitado':
        return {
          badge: <Badge variant="destructive">Rejeitado</Badge>,
          color: 'text-destructive',
          icon: <XCircle className="h-4 w-4" />
        };
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!kycData) {
    return <div>Erro ao carregar dados</div>;
  }

  const statusInfo = getStatusInfo(kycData.kyc_status);
  const isVerified = kycData.kyc_status === 'verificado';
  const isPending = kycData.kyc_status === 'pendente';
  const isRejected = kycData.kyc_status === 'rejeitado';
  const canSubmit = !isVerified && !isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Verificação de Identidade</h1>
        <p className="text-muted-foreground mt-2">
          Complete a verificação da sua identidade para acessar todas as funcionalidades da plataforma.
        </p>
      </div>

      {/* Status atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {statusInfo.icon}
            Status da Verificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">Status atual:</span>
            {statusInfo.badge}
          </div>

          {kycData.kyc_submitted_at && (
            <p className="text-sm text-muted-foreground">
              Enviado em: {new Date(kycData.kyc_submitted_at).toLocaleDateString('pt-BR')}
            </p>
          )}

          {kycData.kyc_reviewed_at && (
            <p className="text-sm text-muted-foreground">
              Analisado em: {new Date(kycData.kyc_reviewed_at).toLocaleDateString('pt-BR')}
            </p>
          )}

          {isRejected && kycData.kyc_rejection_reason && (
            <Alert className="border-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">Motivo da rejeição:</span> {kycData.kyc_rejection_reason}
              </AlertDescription>
            </Alert>
          )}

          {isVerified && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Sua identidade foi verificada com sucesso! Agora você pode acessar todas as funcionalidades da plataforma.
              </AlertDescription>
            </Alert>
          )}

          {isPending && (
            <Alert className="border-yellow-500 bg-yellow-50">
              <Clock className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700">
                Seus documentos estão em análise. Você será notificado sobre o resultado em breve.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Upload de documentos */}
      {canSubmit && (
        <Card>
          <CardHeader>
            <CardTitle>Enviar Documentos</CardTitle>
            <CardDescription>
              Envie os documentos necessários para verificar sua identidade. Formatos aceitos: JPG, PNG, PDF (máx. 5MB cada).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Frente do BI */}
            <div className="space-y-2">
              <Label htmlFor="id-front">Frente do Bilhete de Identidade</Label>
              <div className="flex items-center gap-4">
                <Input
                  ref={idFrontRef}
                  id="id-front"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => handleFileChange('idFront', e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => idFrontRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Selecionar Foto Frontal
                </Button>
                {files.idFront && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {files.idFront.name}
                  </span>
                )}
              </div>
            </div>

            {/* Verso do BI */}
            <div className="space-y-2">
              <Label htmlFor="id-back">Verso do Bilhete de Identidade</Label>
              <div className="flex items-center gap-4">
                <Input
                  ref={idBackRef}
                  id="id-back"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => handleFileChange('idBack', e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => idBackRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Selecionar Foto Traseira
                </Button>
                {files.idBack && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {files.idBack.name}
                  </span>
                )}
              </div>
            </div>

            {/* Selfie */}
            <div className="space-y-2">
              <Label htmlFor="selfie">Selfie com Documento</Label>
              <div className="flex items-center gap-4">
                <Input
                  ref={selfieRef}
                  id="selfie"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => handleFileChange('selfie', e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => selfieRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Selecionar Selfie
                </Button>
                {files.selfie && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {files.selfie.name}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Tire uma selfie segurando o seu documento ao lado do rosto
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!files.idFront || !files.idBack || !files.selfie || uploading}
              className="w-full"
            >
              {uploading ? 'Enviando...' : 'Enviar Documentos'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}