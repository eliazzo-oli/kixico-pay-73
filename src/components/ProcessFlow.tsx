import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  UserPlus, 
  Package, 
  Link as LinkIcon, 
  ShoppingCart, 
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import businessGrowthImage from "@/assets/business-growth.png";

export default function ProcessFlow() {
  const steps = [
    {
      icon: UserPlus,
      number: "01",
      title: "Cadastro Simples",
      description: "Crie sua conta em menos de 2 minutos",
      details: [
        "Verificação automática",
        "Sem burocracia",
        "Documentos mínimos"
      ]
    },
    {
      icon: Package,
      number: "02", 
      title: "Cadastre Produtos",
      description: "Adicione seus produtos ou serviços facilmente",
      details: [
        "Upload de imagens",
        "Descrições detalhadas",
        "Preços flexíveis"
      ]
    },
    {
      icon: LinkIcon,
      number: "03",
      title: "Gere Links",
      description: "Crie links de pagamento personalizados",
      details: [
        "Links únicos",
        "QR Codes automáticos",
        "Compartilhamento fácil"
      ]
    },
    {
      icon: ShoppingCart,
      number: "04",
      title: "Receba Pagamentos",
      description: "Seus clientes pagam de forma segura e rápida",
      details: [
        "Checkout otimizado",
        "Múltiplas formas de pagamento",
        "Confirmação instantânea"
      ]
    }
  ];

  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Como Funciona a
            <span className="text-secondary ml-3">
              KixicoPay
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Em apenas 4 passos simples, você estará vendendo online e recebendo pagamentos instantâneos.
          </p>
        </div>

        {/* Business Growth Image */}
        <div className="mb-16">
          <div className="max-w-4xl mx-auto">
            <img 
              src={businessGrowthImage}
              alt="Profissional usando tecnologia para impulsionar negócios"
              className="w-full h-auto rounded-2xl shadow-lg object-cover animate-fade-in hover:scale-105 transition-transform duration-500 hover:shadow-xl"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="h-full group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
                <CardHeader className="text-center pb-4">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {step.number}
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-2">{step.title}</CardTitle>
                  <CardDescription className="text-base">{step.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-center text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              {/* Arrow between steps (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Demo CTA */}
        <div className="text-center bg-primary rounded-2xl p-12 text-white">
          <h3 className="text-3xl font-bold mb-4">
            Veja a KixicoPay em Ação
          </h3>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Teste nossa plataforma sem compromisso. Crie sua primeira venda em menos de 5 minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" className="bg-white text-primary hover:bg-white/90" asChild>
              <a href="/auth">
                Teste Grátis por 30 Dias
              </a>
            </Button>
            <Button variant="outline" size="xl" className="border-white text-white hover:bg-white/10" asChild>
              <a href="/demo">
                Ver Demonstração
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}