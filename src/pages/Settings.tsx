import { User, HelpCircle, LogOut, Settings as SettingsIcon, Shield } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { TrialBanner } from '@/components/TrialBanner';

const settingsItems = [
  {
    title: 'Minha conta',
    url: '/configuracoes/conta',
    icon: User,
    description: 'Dados pessoais e configurações da conta'
  },
  {
    title: 'Segurança',
    url: '/configuracoes/seguranca',
    icon: Shield,
    description: 'Autenticação de dois fatores e outras configurações'
  },
  {
    title: 'Verificação de Identidade',
    url: '/configuracoes/verificacao',
    icon: Shield,
    description: 'Verificar identidade (KYC) para usar todas as funcionalidades'
  },
  {
    title: 'Central de ajuda',
    url: '/configuracoes/ajuda',
    icon: HelpCircle,
    description: 'Suporte e documentação'
  },
];

export default function Settings() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left ${
      isActive 
        ? 'bg-primary text-primary-foreground shadow-sm' 
        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
    }`;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <TrialBanner />
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-80 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5" />
                  Configurações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {settingsItems.map((item) => (
                  <NavLink 
                    key={item.title} 
                    to={item.url} 
                    className={getNavClassName}
                  >
                    <item.icon className="w-4 h-4" />
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs opacity-70">{item.description}</div>
                    </div>
                  </NavLink>
                ))}
                
                <Separator className="my-4" />
                
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4" />
                  <div>
                    <div className="font-medium">Sair</div>
                    <div className="text-xs opacity-70">Encerrar sessão</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="flex-1">
            <Card>
              <CardContent className="p-8">
                <Outlet />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}