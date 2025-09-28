import { useState } from 'react';
import { Shield, QrCode, Key, Download, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TwoFactorSettingsProps {
  profile: {
    is_two_factor_enabled: boolean;
  };
  onUpdate: () => void;
}

export default function TwoFactorSettings({ profile, onUpdate }: TwoFactorSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [manualKey, setManualKey] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showSetup, setShowSetup] = useState(false);
  const [setupStep, setSetupStep] = useState<'generate' | 'verify' | 'codes'>('generate');

  const handleGenerate2FA = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('2fa-generate');
      
      if (error) throw error;

      setQrCode(data.qrCode);
      setSecret(data.secret);
      setManualKey(data.manualEntryKey);
      setShowSetup(true);
      setSetupStep('verify');
      
      toast.success('QR Code gerado com sucesso');
    } catch (error: any) {
      console.error('Error generating 2FA:', error);
      toast.error(error.message || 'Erro ao gerar código QR');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Por favor, insira um código de 6 dígitos');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('2fa-enable', {
        body: { code: verificationCode }
      });
      
      if (error) throw error;

      setRecoveryCodes(data.recoveryCodes);
      setSetupStep('codes');
      
      toast.success('2FA ativado com sucesso!');
      onUpdate();
    } catch (error: any) {
      console.error('Error enabling 2FA:', error);
      toast.error(error.message || 'Código inválido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishSetup = () => {
    setShowSetup(false);
    setSetupStep('generate');
    setVerificationCode('');
    setQrCode('');
    setSecret('');
    setRecoveryCodes([]);
  };

  const downloadRecoveryCodes = () => {
    const content = recoveryCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recovery-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (showSetup) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Configurar Autenticação de Dois Fatores
          </CardTitle>
          <CardDescription>
            Configure o 2FA para aumentar a segurança da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {setupStep === 'verify' && (
            <>
              <div className="text-center space-y-4">
                <h3 className="text-lg font-medium">Escaneie o código QR</h3>
                <p className="text-sm text-muted-foreground">
                  Use uma aplicação autenticadora como Google Authenticator, Authy ou 1Password
                </p>
                
                {qrCode && (
                  <div className="flex justify-center">
                    <img src={qrCode} alt="QR Code para 2FA" className="border rounded-lg" />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Ou insira manualmente esta chave:</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <code className="text-sm font-mono">{manualKey}</code>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Código de verificação</Label>
                  <Input
                    id="verification-code"
                    placeholder="123456"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-lg tracking-widest"
                  />
                  <p className="text-xs text-muted-foreground">
                    Insira o código de 6 dígitos da sua aplicação autenticadora
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowSetup(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleEnable2FA}
                    disabled={isLoading || verificationCode.length !== 6}
                    className="flex-1"
                  >
                    {isLoading ? 'Verificando...' : 'Ativar 2FA'}
                  </Button>
                </div>
              </div>
            </>
          )}
          
          {setupStep === 'codes' && (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante!</strong> Guarde estes códigos de recuperação num local seguro. 
                  Eles permitem aceder à sua conta se perder o acesso à aplicação autenticadora.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Códigos de Recuperação</h3>
                <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                  {recoveryCodes.map((code, index) => (
                    <div key={index} className="font-mono text-sm p-2 bg-background rounded border">
                      {code}
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={downloadRecoveryCodes}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descarregar
                  </Button>
                  <Button
                    onClick={handleFinishSetup}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Concluir
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Autenticação de Dois Fatores (2FA)
        </CardTitle>
        <CardDescription>
          Adicione uma camada extra de segurança à sua conta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-medium">Status do 2FA</p>
            <p className="text-sm text-muted-foreground">
              {profile.is_two_factor_enabled 
                ? 'A autenticação de dois fatores está ativa'
                : 'A autenticação de dois fatores está desativa'
              }
            </p>
          </div>
          <Badge variant={profile.is_two_factor_enabled ? 'default' : 'secondary'}>
            {profile.is_two_factor_enabled ? 'Ativado' : 'Desativado'}
          </Badge>
        </div>
        
        {!profile.is_two_factor_enabled && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <QrCode className="w-5 h-5 mt-0.5 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="font-medium">Configurar 2FA</p>
                  <p className="text-sm text-muted-foreground">
                    Use uma aplicação autenticadora para gerar códigos únicos
                  </p>
                </div>
              </div>
              
              <Button
                onClick={handleGenerate2FA}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Gerando...' : 'Configurar 2FA'}
              </Button>
            </div>
          </>
        )}
        
        {profile.is_two_factor_enabled && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Key className="w-5 h-5 mt-0.5 text-green-600" />
                <div className="space-y-1">
                  <p className="font-medium text-green-600">2FA Ativo</p>
                  <p className="text-sm text-muted-foreground">
                    A sua conta está protegida com autenticação de dois fatores
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}