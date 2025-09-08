import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Target, 
  Award, 
  Heart,
  MapPin,
  Calendar,
  TrendingUp,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const stats = [
  {
    icon: Users,
    title: "10,000+",
    description: "Empreendedores ativos"
  },
  {
    icon: TrendingUp,
    title: "50M AOA",
    description: "Processados mensalmente"
  },
  {
    icon: Shield,
    title: "99.9%",
    description: "Uptime garantido"
  },
  {
    icon: Award,
    title: "5 anos",
    description: "De experiência"
  }
];

const team = [
  {
    name: "João Silva",
    role: "CEO & Fundador",
    description: "Especialista em fintech com mais de 10 anos de experiência."
  },
  {
    name: "Ana Santos",
    role: "CTO",
    description: "Engenheira de software especializada em sistemas de pagamento."
  },
  {
    name: "Carlos Mendes",
    role: "Head de Produto",
    description: "Designer de experiência com foco em soluções financeiras."
  },
  {
    name: "Maria Oliveira",
    role: "Head de Marketing",
    description: "Especialista em marketing digital para startups de tecnologia."
  }
];

const values = [
  {
    icon: Heart,
    title: "Proximidade",
    description: "Entendemos as necessidades dos empreendedores angolanos."
  },
  {
    icon: Shield,
    title: "Segurança",
    description: "Protegemos cada transação com tecnologia de ponta."
  },
  {
    icon: Target,
    title: "Simplicidade",
    description: "Tornamos os pagamentos digitais acessíveis para todos."
  },
  {
    icon: TrendingUp,
    title: "Crescimento",
    description: "Crescemos junto com o seu negócio."
  }
];

export default function About() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Sobre o KixicoPay
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Conectando Angola ao futuro dos pagamentos digitais
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Somos uma fintech angolana dedicada a simplificar pagamentos online 
            e empoderar empreendedores locais com tecnologia de classe mundial.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/auth')}
            className="mr-4"
          >
            Começar Agora
          </Button>
          <Button 
            size="lg"
            variant="outline"
            onClick={() => navigate('/suporte')}
          >
            Falar Conosco
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-6">
                <stat.icon className="w-8 h-8 mx-auto mb-4 text-primary" />
                <h3 className="text-2xl font-bold text-foreground mb-2">{stat.title}</h3>
                <p className="text-sm text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mission */}
        <div className="mb-16">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl font-bold mb-6 text-foreground">Nossa Missão</h2>
              <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
                Democratizar o acesso a soluções de pagamento digital em Angola, 
                oferecendo ferramentas simples, seguras e acessíveis que permitam 
                a qualquer empreendedor vender online e crescer seu negócio no 
                ambiente digital.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Nossos Valores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <value.icon className="w-10 h-10 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2 text-foreground">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Leadership Image */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              Liderança Comprometida
            </h2>
            <div className="max-w-lg mx-auto mb-8">
              <img 
                src="/lovable-uploads/0f5bf660-8c04-40db-bce3-5eeffc70c9d5.png"
                alt="Liderança KixicoPay - Tecnologia e inovação em Angola"
                className="w-full h-auto rounded-2xl shadow-lg object-cover"
              />
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nossa equipe combina experiência internacional com conhecimento profundo 
              do mercado angolano, desenvolvendo soluções que realmente atendem às 
              necessidades dos empreendedores locais.
            </p>
          </div>
        </div>

        {/* Team */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Nossa Equipe
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1 text-foreground">{member.name}</h3>
                  <p className="text-sm text-primary mb-3">{member.role}</p>
                  <p className="text-sm text-muted-foreground">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* History */}
        <div className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Nossa História
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">2019 - Fundação</h4>
                    <p className="text-muted-foreground">
                      O KixicoPay nasce com a visão de simplificar pagamentos digitais em Angola.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">2020 - Expansão</h4>
                    <p className="text-muted-foreground">
                      Lançamento da plataforma e primeiros clientes em Luanda.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">2021-2024 - Crescimento</h4>
                    <p className="text-muted-foreground">
                      Mais de 10.000 empreendedores ativos e 50M AOA processados mensalmente.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4 text-foreground">
              Junte-se à Revolução dos Pagamentos Digitais
            </h3>
            <p className="text-muted-foreground mb-6">
              Faça parte da comunidade de empreendedores que já confiam no KixicoPay
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
            >
              Criar Conta Grátis
            </Button>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}