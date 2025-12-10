import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface PlanDisplay {
  id: string;
  name: string;
  price: number;
  currency: string;
  maxProducts: string;
  withdrawalFee: number;
  highlight: string;
  features: string[];
  icon: React.ElementType;
  isPopular?: boolean;
}

export default function Precos() {
  const navigate = useNavigate();

  const plans: PlanDisplay[] = [
    {
      id: 'gratuito',
      name: 'Gratuito',
      price: 0,
      currency: 'AOA',
      maxProducts: '1 Produto Ativo',
      withdrawalFee: 10,
      highlight: 'Para começar sem riscos',
      features: [
        'Saques Instantâneos',
        'Pixel de Rastreamento',
        'Link de Checkout Personalizado',
      ],
      icon: Zap,
    },
    {
      id: 'basico',
      name: 'Básico',
      price: 4999,
      currency: 'AOA',
      maxProducts: 'Até 3 Produtos Ativos',
      withdrawalFee: 7,
      highlight: 'Para quem quer crescer',
      features: [
        'Tudo do Gratuito',
        'Order Bump Ativado (Venda mais)',
        'Cupões de Desconto',
        'Personalização Avançada',
      ],
      icon: Crown,
    },
    {
      id: 'profissional',
      name: 'Profissional',
      price: 14999,
      currency: 'AOA',
      maxProducts: 'Produtos Ilimitados',
      withdrawalFee: 3,
      highlight: 'Para máxima lucratividade',
      features: [
        'Tudo do Básico',
        'Suporte Prioritário',
        'Menor Taxa do Mercado (3%)',
        'Relatórios Avançados',
        'API de Integração',
      ],
      icon: Building,
      isPopular: true,
    },
  ];

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Grátis';
    return price.toLocaleString('pt-AO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }) + ' ' + currency;
  };

  const handleGetStarted = (plan: PlanDisplay) => {
    if (plan.price === 0) {
      navigate('/auth');
    } else {
      navigate('/checkout', { 
        state: { 
          planId: plan.id, 
          planName: plan.name, 
          planPrice: plan.price,
          isUpgrade: false 
        } 
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Escolha o plano ideal para o seu negócio
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Planos flexíveis que crescem com o seu negócio. Comece gratuitamente e faça upgrade quando precisar.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan) => {
                const IconComponent = plan.icon;
                return (
                  <Card 
                    key={plan.id} 
                    className={`relative ${plan.isPopular ? 'border-primary shadow-lg scale-105' : ''}`}
                    variant={plan.isPopular ? "gradient" : "default"}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                          Mais Popular
                        </span>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-8">
                      <div className="flex justify-center mb-3">
                        <IconComponent className="h-10 w-10 text-primary" />
                      </div>
                      <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {plan.highlight}
                      </CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-foreground">{formatPrice(plan.price, plan.currency)}</span>
                        {plan.price > 0 && <span className="text-muted-foreground">/mês</span>}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-foreground font-medium">
                            {plan.maxProducts}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-foreground">
                            Taxa de transação de {plan.withdrawalFee}%
                          </span>
                        </div>
                      </div>
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-foreground">{feature}</span>
                        </div>
                      ))}
                    </CardContent>

                    <CardFooter className="flex flex-col gap-3">
                      <Button 
                        className="w-full" 
                        variant={plan.isPopular ? "default" : "outline"}
                        onClick={() => handleGetStarted(plan)}
                      >
                        {plan.price === 0 ? 'Começar Grátis' : 'Começar agora'}
                      </Button>
                      {plan.price > 0 && (
                        <Button 
                          className="w-full" 
                          variant="ghost"
                          onClick={() => navigate('/auth')}
                        >
                          Começar avaliação gratuita de 30 dias
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            <div className="text-center mt-16">
              <p className="text-muted-foreground mb-4">
                Todos os planos incluem segurança de nível bancário, saques instantâneos e suporte técnico
              </p>
              <p className="text-sm text-muted-foreground">
                Preços em Kwanza Angolano (AOA). Sem taxas de configuração ou contratos longos.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}