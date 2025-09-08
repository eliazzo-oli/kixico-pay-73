import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Zap, Shield, BarChart3, CreditCard, Users, Globe, Headphones, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const mainFeatures = [
  {
    icon: ShoppingCart,
    title: "Checkout Otimizado",
    description: "Processo de pagamento simplificado que aumenta suas conversões",
    details: [
      "Interface intuitiva e responsiva",
      "Checkout em uma única página",
      "Múltiplas opções de pagamento",
      "Carrinho de compras inteligente"
    ]
  },
  {
    icon: Zap,
    title: "Pagamentos Rápidos",
    description: "Transações processadas em segundos com máxima eficiência",
    details: [
      "Processamento instantâneo",
      "Aprovação em tempo real",
      "Saques express disponíveis",
      "Notificações automáticas"
    ]
  },
  {
    icon: Shield,
    title: "Segurança Total",
    description: "Proteção de nível bancário para todas as transações",
    details: [
      "Criptografia SSL 256-bit",
      "Conformidade PCI DSS",
      "Detecção de fraudes em tempo real",
      "Autenticação de dois fatores"
    ]
  },
  {
    icon: BarChart3,
    title: "Análises Avançadas",
    description: "Dashboards completos para acompanhar seu negócio",
    details: [
      "Relatórios detalhados de vendas",
      "Métricas de conversão",
      "Análise de comportamento do cliente",
      "Exportação de dados em tempo real"
    ]
  }
];

const additionalFeatures = [
  {
    icon: CreditCard,
    title: "Multi-moeda",
    description: "Aceite pagamentos em diferentes moedas e expand sua reach global"
  },
  {
    icon: Users,
    title: "Gestão de Clientes",
    description: "Controle completo sobre sua base de clientes e histórico de compras"
  },
  {
    icon: Globe,
    title: "API Robusta",
    description: "Integração fácil com sistemas existentes através da nossa API RESTful"
  },
  {
    icon: Headphones,
    title: "Suporte 24/7",
    description: "Equipe especializada disponível a qualquer hora para te ajudar"
  }
];

export default function Produtos() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Funcionalidades que impulsionam seu negócio
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Descubra todas as ferramentas poderosas que oferecemos para transformar 
                a forma como você recebe pagamentos online.
              </p>
              <Button size="lg" onClick={handleGetStarted}>
                Começar gratuitamente
              </Button>
            </div>
          </div>
        </section>

        {/* Main Features */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Principais funcionalidades
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Ferramentas essenciais para maximizar suas vendas e otimizar sua operação
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {mainFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={index} className="h-full" variant="hover">
                    <CardHeader>
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {feature.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                            <span className="text-foreground">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Additional Features */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                E muito mais
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Recursos adicionais que fazem a diferença no seu dia a dia
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {additionalFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={index} className="text-center" variant="hover">
                    <CardHeader>
                      <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="w-8 h-8 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-primary">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Pronto para começar?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de empresas que já transformaram 
              seus pagamentos online com nossa plataforma.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={handleGetStarted}
              >
                Começar gratuitamente
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-primary"
                onClick={() => navigate("/demo")}
              >
                Ver demonstração
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}