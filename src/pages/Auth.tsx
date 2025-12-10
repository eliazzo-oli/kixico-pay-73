import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import kixicoPayLogo from "/lovable-uploads/9a0e296b-bc4f-460b-9e96-40c29ccfbe47.png";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await signIn(email, password);
        
        // Check if 2FA is required
        if (result.requires2FA) {
          navigate('/2fa-verify', { 
            state: { email, password } 
          });
          return;
        }
      } else {
        if (!name.trim()) {
          toast({
            title: 'Erro',
            description: 'Nome é obrigatório',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
        result = await signUp(email, password, name);
      }

      if (result.error) {
        toast({
          title: 'Erro',
          description: result.error.message,
          variant: 'destructive',
        });
      } else if (!isLogin) {
        toast({
          title: 'Sucesso',
          description: 'Conta criada com sucesso! Você ganhou 30 dias grátis com funcionalidades do plano Profissional. Faça login para continuar.',
        });
        setIsLogin(true);
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <button 
            onClick={() => navigate('/')}
            className="inline-block hover:opacity-80 transition-opacity mb-4"
          >
            <img 
              src="/assets/logo-vertical.png" 
              alt="KixicoPay" 
              className="h-40 md:h-56 w-auto mx-auto logo-animated optimized-image"
              loading="eager"
              decoding="async"
            />
          </button>
          <p className="text-muted-foreground mt-2">
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
        </div>

        <Card className="border-border/50 shadow-elegant">
          <CardHeader>
            <CardTitle className="text-foreground">
              {isLogin ? 'Login' : 'Registro'}
            </CardTitle>
                <CardDescription>
                  {isLogin 
                    ? 'Entre com suas credenciais para acessar sua conta'
                    : 'Preencha os dados para criar sua conta e aproveite 30 dias grátis com funcionalidades do plano Profissional!'
                  }
                </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    placeholder="Seu nome completo"
                  />
                </div>
              )}

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

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Sua senha"
                  minLength={6}
                />
                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-sm text-primary hover:text-primary-glow transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                variant="premium"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar conta')}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setEmail('');
                    setPassword('');
                    setName('');
                  }}
                  className="text-primary hover:text-primary-glow transition-colors"
                >
                  {isLogin ? 'Não tem conta? Registre-se' : 'Já tem conta? Faça login'}
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}