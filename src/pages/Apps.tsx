import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrialBanner } from '@/components/TrialBanner';
import { Facebook, BarChart3, Webhook, Award, ExternalLink } from 'lucide-react';

const apps = [
  {
    id: 'facebook-pixel',
    name: 'Facebook Pixel',
    description: 'Rastreie conversões, otimize anúncios e crie públicos personalizados.',
    icon: Facebook,
    status: 'available',
    category: 'Marketing',
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Analise o comportamento dos visitantes e meça o desempenho do seu checkout.',
    icon: BarChart3,
    status: 'available',
    category: 'Analytics',
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Integre com sistemas externos recebendo notificações em tempo real.',
    icon: Webhook,
    status: 'connected',
    category: 'Integrações',
  },
  {
    id: 'certificates',
    name: 'Certificados',
    description: 'Emita certificados automáticos para alunos que completarem cursos.',
    icon: Award,
    status: 'coming_soon',
    category: 'Automação',
  },
];

export default function Apps() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Conectado</Badge>;
      case 'available':
        return <Badge variant="outline">Disponível</Badge>;
      case 'coming_soon':
        return <Badge variant="secondary">Em Breve</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <TrialBanner />
      
      <div>
        <h1 className="text-2xl font-bold text-foreground">Apps & Integrações</h1>
        <p className="text-muted-foreground mt-1">
          Conecte ferramentas externas para potencializar suas vendas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {apps.map((app) => (
          <Card key={app.id} className="border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <app.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{app.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{app.category}</p>
                  </div>
                </div>
                {getStatusBadge(app.status)}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">{app.description}</CardDescription>
              <Button 
                variant={app.status === 'connected' ? 'outline' : 'default'}
                size="sm"
                className="w-full"
                disabled={app.status === 'coming_soon'}
              >
                {app.status === 'connected' ? (
                  <>Configurar</>
                ) : app.status === 'coming_soon' ? (
                  <>Em Breve</>
                ) : (
                  <>
                    Conectar
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed border-2 border-border/50">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground text-sm">
            Mais integrações serão adicionadas em breve. Tem uma sugestão?{' '}
            <a href="/suporte" className="text-primary hover:underline">
              Fale connosco
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
