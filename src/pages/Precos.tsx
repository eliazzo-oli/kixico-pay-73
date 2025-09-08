import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  max_products: number;
  withdrawal_time: string;
  transaction_fee: number;
  features: string[];
  is_active: boolean;
}

export default function Precos() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      toast.error('Erro ao carregar planos disponíveis');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return price.toLocaleString('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' ' + currency;
  };

  const getDescription = (planName: string) => {
    switch (planName) {
      case 'Básico':
        return 'Perfeito para começar';
      case 'Profissional':
        return 'Para negócios em crescimento';
      case 'Empresarial':
        return 'Para grandes volumes';
      default:
        return 'Plano disponível';
    }
  };

  const handleGetStarted = (plan: Plan) => {
    navigate('/checkout', { 
      state: { 
        planId: plan.id, 
        planName: plan.name, 
        planPrice: plan.price,
        isUpgrade: false 
      } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 px-4">
            <div className="container mx-auto max-w-7xl text-center">
              <div className="text-foreground">Carregando planos...</div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

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
              {plans.map((plan, index) => {
                const isPopular = plan.name === 'Profissional';
                return (
                  <Card 
                    key={plan.id} 
                    className={`relative ${isPopular ? 'border-primary shadow-lg scale-105' : ''}`}
                    variant={isPopular ? "gradient" : "default"}
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                          Mais Popular
                        </span>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-8">
                      <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {getDescription(plan.name)}
                      </CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-foreground">{formatPrice(plan.price, plan.currency)}</span>
                        <span className="text-muted-foreground">/mês</span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-foreground">
                            {plan.max_products === -1 ? 'Produtos ilimitados' : `Cadastro de até ${plan.max_products} produtos`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-foreground">
                            Saques processados em {plan.withdrawal_time}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-foreground">
                            Taxa de transação de {plan.transaction_fee}%
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
                        variant={isPopular ? "default" : "outline"}
                        onClick={() => handleGetStarted(plan)}
                      >
                        Começar agora
                      </Button>
                      <Button 
                        className="w-full" 
                        variant="ghost"
                        onClick={() => handleGetStarted(plan)}
                      >
                        Começar avaliação gratuita de 30 dias
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            <div className="text-center mt-16">
              <p className="text-muted-foreground mb-4">
                Todos os planos incluem segurança de nível bancário e suporte técnico
              </p>
              <p className="text-sm text-muted-foreground">
                Preços em Kwanza Angolano (KZS). Sem taxas de configuração ou contratos longos.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}