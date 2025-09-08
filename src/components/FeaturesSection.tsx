import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Smartphone, 
  Globe, 
  BarChart3, 
  Lock, 
  Zap, 
  HeadphonesIcon,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FeaturesSection() {
  const features = [
    {
      icon: Smartphone,
      title: "Checkout Otimizado",
      description: "Interface intuitiva que converte mais visitantes em clientes pagantes.",
      benefits: ["Taxa de conversão 40% maior", "Mobile-first", "1-click checkout"]
    },
    {
      icon: Zap,
      title: "Pagamentos Instantâneos",
      description: "Receba seus pagamentos em tempo real, sem esperas.",
      benefits: ["Saques em segundos", "0% de atraso", "Disponível 24/7"]
    },
    {
      icon: Lock,
      title: "Segurança Total",
      description: "Proteção avançada para suas transações e dados dos clientes.",
      benefits: ["Certificação PCI DSS", "Criptografia 256-bit", "Detecção de fraude"]
    },
    {
      icon: BarChart3,
      title: "Analytics Avançado",
      description: "Insights detalhados sobre suas vendas e performance.",
      benefits: ["Relatórios em tempo real", "Métricas de conversão", "Previsões de receita"]
    },
    {
      icon: Globe,
      title: "Multi-moeda",
      description: "Aceite pagamentos em Kwanza e outras moedas internacionais.",
      benefits: ["Kwanza nativo", "USD e EUR", "Conversão automática"]
    },
    {
      icon: HeadphonesIcon,
      title: "Suporte 24/7",
      description: "Equipe especializada sempre disponível para ajudar.",
      benefits: ["Suporte em português", "Chat ao vivo", "Tempo de resposta < 5min"]
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Tudo que Precisa para 
            <span className="text-primary ml-3">
              Vender Mais
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Ferramentas completas para empreendedores que querem maximizar suas vendas
            e eliminar as dores do mercado angolano.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} variant="hover" className="group">
              <CardHeader>
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-success mr-2 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Success Story Image */}
        <div className="mb-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <img 
                src="/lovable-uploads/abf39dfa-338f-472b-8f14-ae6f488f8a9c.png"
                alt="Empreendedora angolana usando KixicoPay para o crescimento do negócio"
                className="w-full h-auto rounded-2xl shadow-lg object-cover animate-fade-in hover:scale-105 transition-transform duration-500 hover:shadow-xl"
              />
            </div>
            <div>
              <h3 className="text-3xl font-bold mb-4 text-foreground">
                Sucesso Real de Empreendedores Angolanos
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                Mais de 10.000 empreendedores já transformaram seus negócios com a KixicoPay. 
                Junte-se aos profissionais que escolheram crescer com tecnologia de ponta.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success mr-3" />
                  <span>Aumento médio de 40% nas vendas</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success mr-3" />
                  <span>Tempo de implementação: menos de 1 hora</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success mr-3" />
                  <span>Suporte especializado em português</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-card rounded-2xl p-12 border">
          <h3 className="text-3xl font-bold mb-4 text-foreground">
            Pronto para Transformar seu Negócio?
          </h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de empreendedores angolanos que já aumentaram suas vendas com a KixicoPay.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="gradient" size="xl" className="group" asChild>
              <a href="/auth">
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <a href="/demo">
                Agendar Demo
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}