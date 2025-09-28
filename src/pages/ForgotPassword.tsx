import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.functions.invoke('request-password-reset', {
        body: { email }
      });

      if (error) {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao enviar email de recuperação',
          variant: 'destructive',
        });
      } else {
        setIsSuccess(true);
        toast({
          title: 'Sucesso',
          description: 'Email enviado! Verifique sua caixa de entrada.',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Algo deu errado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <button 
              onClick={() => navigate('/')}
              className="inline-block hover:opacity-80 transition-opacity mb-4"
            >
              <img 
                src="/lovable-uploads/22ff7c61-cfa1-40d4-a028-a25cba4d4616.png" 
                alt="KixicoPay" 
                className="h-56 w-auto mx-auto logo-animated optimized-image"
                loading="eager"
                decoding="async"
              />
            </button>
          </div>

          <Card className="border-border/50 shadow-elegant">
            <CardHeader className="text-center">
              <CardTitle className="text-foreground">Email Enviado!</CardTitle>
              <CardDescription>
                Enviamos um link de recuperação para {email}. 
                Verifique sua caixa de entrada e spam.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                onClick={() => navigate('/auth')}
                variant="outline"
                className="w-full"
              >
                Voltar ao Login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <button 
            onClick={() => navigate('/')}
            className="inline-block hover:opacity-80 transition-opacity mb-4"
          >
            <img 
              src="/lovable-uploads/22ff7c61-cfa1-40d4-a028-a25cba4d4616.png" 
              alt="KixicoPay" 
              className="h-56 w-auto mx-auto logo-animated optimized-image"
              loading="eager"
              decoding="async"
            />
          </button>
          <p className="text-muted-foreground mt-2">
            Recuperar senha
          </p>
        </div>

        <Card className="border-border/50 shadow-elegant">
          <CardHeader>
            <CardTitle className="text-foreground">Esqueceu a senha?</CardTitle>
            <CardDescription>
              Digite seu email para receber um link de recuperação
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                variant="premium"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  className="text-primary hover:text-primary-glow transition-colors"
                >
                  Voltar ao login
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}