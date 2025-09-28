import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Key, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function TwoFactorVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('authenticator');

  // Get email and password from location state (passed from login)
  const { email, password } = location.state || {};

  if (!email || !password) {
    navigate('/auth');
    return null;
  }

  const handleVerify = async (useRecoveryCode = false) => {
    const inputCode = useRecoveryCode ? recoveryCode : code;
    
    if (!inputCode || (useRecoveryCode ? inputCode.length !== 8 : inputCode.length !== 6)) {
      toast.error(useRecoveryCode ? 'Código de recuperação inválido' : 'Código deve ter 6 dígitos');
      return;
    }

    setIsLoading(true);
    try {
      const requestBody = {
        email,
        password,
        ...(useRecoveryCode ? { recoveryCode: inputCode } : { code: inputCode })
      };

      const { data, error } = await supabase.functions.invoke('2fa-verify', {
        body: requestBody
      });
      
      if (error) throw error;

      // Set the session manually since we got it from the edge function
      if (data.session) {
        await supabase.auth.setSession(data.session);
      }

      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('2FA verification error:', error);
      toast.error(error.message || 'Código inválido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Verificação 2FA</CardTitle>
            <CardDescription>
              Insira o código da sua aplicação autenticadora ou use um código de recuperação
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="authenticator" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Autenticador
              </TabsTrigger>
              <TabsTrigger value="recovery" className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Recuperação
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="authenticator" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="auth-code">Código do autenticador</Label>
                <Input
                  id="auth-code"
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-lg tracking-widest"
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-muted-foreground">
                  Insira o código de 6 dígitos da sua aplicação autenticadora
                </p>
              </div>
              
              <Button
                onClick={() => handleVerify(false)}
                disabled={isLoading || code.length !== 6}
                className="w-full"
              >
                {isLoading ? 'Verificando...' : 'Verificar'}
              </Button>
            </TabsContent>
            
            <TabsContent value="recovery" className="space-y-4 mt-6">
              <Alert>
                <AlertDescription>
                  Use um dos códigos de recuperação que guardou quando configurou o 2FA
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="recovery-code">Código de recuperação</Label>
                <Input
                  id="recovery-code"
                  type="text"
                  placeholder="12345678"
                  maxLength={8}
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.replace(/\s/g, '').toUpperCase())}
                  className="text-center text-lg tracking-wider font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Insira um código de recuperação de 8 caracteres
                </p>
              </div>
              
              <Button
                onClick={() => handleVerify(true)}
                disabled={isLoading || recoveryCode.length !== 8}
                className="w-full"
              >
                {isLoading ? 'Verificando...' : 'Usar código de recuperação'}
              </Button>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handleBackToLogin}
              className="w-full"
            >
              Voltar ao login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}