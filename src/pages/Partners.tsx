import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Handshake,
  CreditCard,
  Smartphone,
  Building,
  Users,
  Award,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const currentPartners = [
  {
    name: "Multicaixa",
    logo: CreditCard,
    category: "Pagamentos",
    description: "Integração completa com o principal sistema de pagamentos de Angola",
    features: ["Pagamentos por referência", "Multicaixa Express", "ATM Network"]
  },
  {
    name: "Unitel Money",
    logo: Smartphone,
    category: "Carteira Digital",
    description: "Parceria estratégica para pagamentos móveis",
    features: ["Pagamentos instantâneos", "Carteira digital", "SMS Banking"]
  },
  {
    name: "PayPal AO",
    logo: Building,
    category: "Pagamentos Internacionais",
    description: "Facilitando transações internacionais para Angola",
    features: ["Pagamentos globais", "Proteção ao comprador", "Câmbio automático"]
  },
  {
    name: "BFA",
    logo: Building,
    category: "Banco",
    description: "Parceria bancária para serviços financeiros completos",
    features: ["Contas empresariais", "Transferências", "Serviços bancários"]
  }
];

const partnerBenefits = [
  {
    icon: Users,
    title: "Acesso a 10.000+ Usuários",
    description: "Alcance nossa base de empreendedores ativos"
  },
  {
    icon: Award,
    title: "Tecnologia de Ponta",
    description: "APIs modernas e integração simplificada"
  },
  {
    icon: CheckCircle,
    title: "Suporte Dedicado",
    description: "Equipe especializada para parceiros"
  },
  {
    icon: Building,
    title: "Co-marketing",
    description: "Campanhas conjuntas e visibilidade mútua"
  }
];

const partnershipTypes = [
  {
    title: "Integração de Pagamentos",
    description: "Torne-se um método de pagamento na nossa plataforma",
    requirements: ["API de pagamentos", "Certificações de segurança", "Suporte 24/7"],
    benefits: ["Volume de transações", "Nova base de clientes", "Receita recorrente"]
  },
  {
    title: "Parceria Tecnológica",
    description: "Integre nossa API em sua plataforma ou aplicação",
    requirements: ["Plataforma estabelecida", "Base de usuários ativa", "Compliance"],
    benefits: ["Monetização adicional", "Serviços de pagamento", "Suporte técnico"]
  },
  {
    title: "Revendedor/Distribuidor",
    description: "Revenda nossas soluções para seus clientes",
    requirements: ["Rede de clientes", "Experiência em fintech", "Certificação"],
    benefits: ["Comissões atrativas", "Materiais de marketing", "Treinamento"]
  },
  {
    title: "Parceria Estratégica",
    description: "Desenvolva soluções conjuntas e explore novos mercados",
    requirements: ["Alinhamento estratégico", "Recursos dedicados", "Vision compartilhada"],
    benefits: ["Inovação conjunta", "Expansão de mercado", "Crescimento mútuo"]
  }
];

export default function Partners() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Handshake className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Parceiros do KixicoPay
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Construímos o ecossistema de pagamentos digitais mais robusto de Angola 
            através de parcerias estratégicas com líderes do setor.
          </p>
          <Button 
            size="lg"
            onClick={() => window.open('mailto:parcerias@kixicopay.ao')}
          >
            Tornar-se Parceiro
          </Button>
        </div>

        {/* Current Partners */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Nossos Parceiros Atuais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentPartners.map((partner, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <partner.logo className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{partner.name}</h3>
                        <Badge variant="secondary">{partner.category}</Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{partner.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {partner.features.map((feature, featureIndex) => (
                          <Badge key={featureIndex} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Partner Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Benefícios da Parceria
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {partnerBenefits.map((benefit, index) => (
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

        {/* Partnership Types */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Tipos de Parceria
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {partnershipTypes.map((type, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <CardTitle className="text-xl">{type.title}</CardTitle>
                  <p className="text-muted-foreground">{type.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">Requisitos:</h4>
                    <ul className="space-y-1">
                      {type.requirements.map((req, reqIndex) => (
                        <li key={reqIndex} className="text-sm text-muted-foreground flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">Benefícios:</h4>
                    <ul className="space-y-1">
                      {type.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="text-sm text-muted-foreground flex items-center gap-2">
                          <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Process */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Como nos Tornamos Parceiros
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  1
                </div>
                <h3 className="font-semibold mb-2 text-foreground">Contato Inicial</h3>
                <p className="text-sm text-muted-foreground">
                  Entre em contato conosco com sua proposta
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  2
                </div>
                <h3 className="font-semibold mb-2 text-foreground">Avaliação</h3>
                <p className="text-sm text-muted-foreground">
                  Análise de compatibilidade e potencial
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  3
                </div>
                <h3 className="font-semibold mb-2 text-foreground">Negociação</h3>
                <p className="text-sm text-muted-foreground">
                  Definição dos termos da parceria
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  4
                </div>
                <h3 className="font-semibold mb-2 text-foreground">Integração</h3>
                <p className="text-sm text-muted-foreground">
                  Implementação e lançamento conjunto
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Success Stories */}
        <div className="mb-16">
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                História de Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  Integração com Multicaixa
                </h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  "A parceria com o KixicoPay nos permitiu alcançar uma nova geração de 
                  empreendedores digitais. Em apenas 6 meses, vimos um aumento de 300% 
                  nas transações online através da plataforma."
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  - Representante Multicaixa
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4 text-foreground">
              Pronto para Revolucionar Pagamentos Juntos?
            </h3>
            <p className="text-muted-foreground mb-6">
              Junte-se ao nosso ecossistema e ajude a construir o futuro dos pagamentos digitais em Angola
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => window.open('mailto:parcerias@kixicopay.ao')}
              >
                <Handshake className="w-4 h-4 mr-2" />
                Propor Parceria
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