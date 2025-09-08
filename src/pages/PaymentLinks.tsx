import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Link2,
  Share2,
  QrCode,
  CreditCard,
  Smartphone,
  CheckCircle,
  ArrowRight,
  Copy,
  Settings,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const features = [
  {
    icon: Link2,
    title: "Links Personalizados",
    description: "Crie links únicos para cada produto ou serviço"
  },
  {
    icon: QrCode,
    title: "QR Codes Automáticos",
    description: "Gere QR codes para facilitar pagamentos móveis"
  },
  {
    icon: Share2,
    title: "Compartilhamento Fácil",
    description: "Envie por WhatsApp, email ou redes sociais"
  },
  {
    icon: Settings,
    title: "Configuração Simples",
    description: "Configure valores, descrições e métodos de pagamento"
  },
  {
    icon: BarChart3,
    title: "Relatórios Detalhados",
    description: "Acompanhe cliques, conversões e pagamentos"
  },
  {
    icon: CheckCircle,
    title: "Pagamentos Seguros",
    description: "Tecnologia de ponta para proteger transações"
  }
];

const useCases = [
  {
    title: "Freelancers",
    description: "Receba pagamentos de clientes sem precisar de um site",
    icon: "👨‍💻",
    examples: ["Serviços de design", "Consultorias", "Aulas particulares"]
  },
  {
    title: "Comércio Local",
    description: "Venda produtos localmente com entrega ou retirada",
    icon: "🏪",
    examples: ["Restaurantes", "Artesanato", "Produtos caseiros"]
  },
  {
    title: "Eventos",
    description: "Venda ingressos e aceite pagamentos para eventos",
    icon: "🎉",
    examples: ["Shows", "Workshops", "Conferências"]
  },
  {
    title: "Serviços Online",
    description: "Monetize seus conhecimentos e habilidades digitais",
    icon: "💻",
    examples: ["Cursos online", "E-books", "Software"]
  }
];

const stepByStep = [
  {
    step: 1,
    title: "Criar Link",
    description: "Configure seu produto, preço e descrição em segundos"
  },
  {
    step: 2,
    title: "Personalizar",
    description: "Escolha métodos de pagamento e customize a aparência"
  },
  {
    step: 3,
    title: "Compartilhar",
    description: "Envie o link ou QR code para seus clientes"
  },
  {
    step: 4,
    title: "Receber",
    description: "Receba pagamentos instantaneamente na sua carteira"
  }
];

const pricingFeatures = [
  "Links ilimitados",
  "QR codes automáticos",
  "Múltiplos métodos de pagamento",
  "Relatórios em tempo real",
  "Suporte 24/7",
  "Integração WhatsApp"
];

export default function PaymentLinks() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Link2 className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Links de Pagamento
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Transforme qualquer produto ou serviço em um link de pagamento. 
            Venda online sem precisar de um site ou loja virtual.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
            >
              Criar Primeiro Link
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/demo')}
            >
              Ver Demonstração
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Recursos Poderosos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <feature.icon className="w-10 h-10 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How it Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Como Funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {stepByStep.map((item, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-2 text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Ideal Para Seu Negócio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {useCases.map((useCase, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{useCase.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2 text-foreground">
                        {useCase.title}
                      </h3>
                      <p className="text-muted-foreground mb-3">{useCase.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {useCase.examples.map((example, exampleIndex) => (
                          <Badge key={exampleIndex} variant="outline" className="text-xs">
                            {example}
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

        {/* Example Link */}
        <div className="mb-16">
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Exemplo de Link de Pagamento
              </CardTitle>
              <p className="text-center text-muted-foreground">
                Veja como fica um link de pagamento real
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="max-w-md mx-auto">
                <Card className="border-2 border-primary/20">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-foreground">
                      Consultoria de Marketing Digital
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Sessão de 1 hora para otimizar suas campanhas online
                    </p>
                    <div className="text-2xl font-bold text-primary mb-4">
                      AOA 25.000,00
                    </div>
                    <Button className="w-full mb-3">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pagar Agora
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Link
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <QrCode className="w-4 h-4 mr-2" />
                        QR Code
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Preços Transparentes
          </h2>
          <div className="max-w-lg mx-auto">
            <Card className="border-primary/50 shadow-lg">
              <CardHeader className="text-center">
                <Badge className="mx-auto mb-4">Mais Popular</Badge>
                <CardTitle className="text-2xl">Links de Pagamento</CardTitle>
                <div className="text-3xl font-bold text-primary">
                  2,5% <span className="text-base font-normal text-muted-foreground">por transação</span>
                </div>
                <p className="text-muted-foreground">Sem taxas mensais ou de setup</p>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3 mb-6">
                  {pricingFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full"
                  size="lg"
                  onClick={() => navigate('/auth')}
                >
                  Começar Agora
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Métodos de Pagamento Aceitos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="p-4">
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Multicaixa</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <Smartphone className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Unitel Money</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">PayPal AO</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Referência</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4 text-foreground">
              Comece a Vender em Minutos
            </h3>
            <p className="text-muted-foreground mb-6">
              Não precisa de conhecimento técnico. Crie seu primeiro link de pagamento agora mesmo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate('/auth')}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Criar Conta Grátis
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/suporte')}
              >
                Falar com Especialista
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}