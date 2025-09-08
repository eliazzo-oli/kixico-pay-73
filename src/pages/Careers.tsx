import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Heart,
  Coffee,
  Users,
  TrendingUp,
  Laptop,
  Shield,
  Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const openPositions = [
  {
    title: "Desenvolvedor Full Stack",
    department: "Tecnologia",
    location: "Luanda, Angola",
    type: "Tempo Integral",
    description: "Procuramos um desenvolvedor experiente em React, Node.js e sistemas de pagamento.",
    requirements: ["3+ anos de experiência", "React/TypeScript", "Node.js", "Bancos de dados SQL"]
  },
  {
    title: "Designer UX/UI",
    department: "Produto",
    location: "Luanda, Angola",
    type: "Tempo Integral", 
    description: "Buscamos um designer criativo para melhorar a experiência dos nossos usuários.",
    requirements: ["2+ anos de experiência", "Figma/Sketch", "Design System", "Prototipagem"]
  },
  {
    title: "Analista de Marketing Digital",
    department: "Marketing",
    location: "Luanda, Angola",
    type: "Tempo Integral",
    description: "Responsável por campanhas digitais e crescimento da base de usuários.",
    requirements: ["Experiência com Google Ads", "Análise de dados", "SEO/SEM", "Redes sociais"]
  },
  {
    title: "Especialista em Suporte",
    department: "Atendimento",
    location: "Luanda, Angola",
    type: "Meio Período",
    description: "Atendimento aos clientes e resolução de questões técnicas.",
    requirements: ["Experiência em suporte", "Comunicação excelente", "Conhecimento técnico básico"]
  }
];

const benefits = [
  {
    icon: Heart,
    title: "Plano de Saúde",
    description: "Cobertura completa para você e sua família"
  },
  {
    icon: Coffee,
    title: "Horário Flexível",
    description: "Work-life balance é prioridade para nós"
  },
  {
    icon: Laptop,
    title: "Equipamentos",
    description: "Notebook e equipamentos de última geração"
  },
  {
    icon: TrendingUp,
    title: "Crescimento",
    description: "Plano de carreira e desenvolvimento contínuo"
  },
  {
    icon: Users,
    title: "Equipe Incrível",
    description: "Trabalhe com pessoas talentosas e colaborativas"
  },
  {
    icon: Award,
    title: "Bônus por Performance",
    description: "Reconhecimento financeiro pelos resultados"
  }
];

const culture = [
  {
    title: "Inovação",
    description: "Estamos sempre buscando maneiras de melhorar e inovar."
  },
  {
    title: "Transparência",
    description: "Comunicação aberta e honesta em todos os níveis."
  },
  {
    title: "Colaboração",
    description: "Trabalhamos juntos para alcançar objetivos comuns."
  },
  {
    title: "Impacto",
    description: "Nosso trabalho faz diferença na vida dos empreendedores."
  }
];

export default function Careers() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Briefcase className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Construa o futuro dos pagamentos conosco
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Junte-se à nossa equipe e ajude a transformar o ecossistema de pagamentos digitais em Angola.
          </p>
        </div>

        {/* Culture */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Nossa Cultura
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {culture.map((item, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2 text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Benefícios e Vantagens
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <benefit.icon className="w-10 h-10 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2 text-foreground">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Open Positions */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Vagas Abertas
          </h2>
          <div className="space-y-6">
            {openPositions.map((position, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-foreground">{position.title}</h3>
                        <Badge variant="secondary">{position.department}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {position.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {position.type}
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-3">{position.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {position.requirements.map((req, reqIndex) => (
                          <Badge key={reqIndex} variant="outline" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Button 
                        onClick={() => window.open('mailto:carreiras@kixicopay.ao?subject=Candidatura - ' + position.title)}
                      >
                        Candidatar-se
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* No Open Positions Message */}
        <Card className="mb-16 bg-muted/50">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-4 text-foreground">
              Não encontrou a vaga ideal?
            </h3>
            <p className="text-muted-foreground mb-6">
              Envie seu currículo mesmo assim! Estamos sempre à procura de talentos excepcionais.
            </p>
            <Button 
              variant="outline"
              onClick={() => window.open('mailto:carreiras@kixicopay.ao?subject=Candidatura Espontânea')}
            >
              Enviar Currículo
            </Button>
          </CardContent>
        </Card>

        {/* Process */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Processo Seletivo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  1
                </div>
                <h3 className="font-semibold mb-2 text-foreground">Candidatura</h3>
                <p className="text-sm text-muted-foreground">
                  Envie seu currículo e carta de apresentação
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  2
                </div>
                <h3 className="font-semibold mb-2 text-foreground">Triagem</h3>
                <p className="text-sm text-muted-foreground">
                  Análise do perfil e adequação à vaga
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  3
                </div>
                <h3 className="font-semibold mb-2 text-foreground">Entrevistas</h3>
                <p className="text-sm text-muted-foreground">
                  Conversas com RH e equipe técnica
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  4
                </div>
                <h3 className="font-semibold mb-2 text-foreground">Proposta</h3>
                <p className="text-sm text-muted-foreground">
                  Oferta e início da jornada conosco
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4 text-foreground">
              Pronto para fazer parte do time?
            </h3>
            <p className="text-muted-foreground mb-6">
              Entre em contato conosco para saber mais sobre oportunidades de carreira
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => window.open('mailto:carreiras@kixicopay.ao')}
              >
                Falar com RH
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/suporte')}
              >
                Mais Informações
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}