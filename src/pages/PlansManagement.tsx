import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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

interface UserCurrentPlan {
  plan_name: string;
  max_products: number;
  withdrawal_time: string;
  transaction_fee: number;
  features: string[];
}

const planIcons = {
  'Básico': Zap,
  'Profissional': Crown,
  'Empresarial': Building,
};

export default function PlansManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState<UserCurrentPlan | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserPlan();
      fetchAvailablePlans();
    }
  }, [user]);

  const fetchUserPlan = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_current_plan', {
        user_uuid: user?.id
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setCurrentPlan(data[0]);
      }
    } catch (error) {
      console.error('Erro ao buscar plano atual:', error);
      toast.error('Erro ao carregar plano atual');
    }
  };

  const fetchAvailablePlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (error) throw error;
      setAvailablePlans(data || []);
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

  const handleUpgrade = (planId: string, planName: string, planPrice: number) => {
    // Redirecionar para checkout com informações do plano
    navigate('/checkout', { 
      state: { 
        planId, 
        planName, 
        planPrice,
        isUpgrade: true 
      } 
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Planos e Assinatura</h1>
          <p className="text-muted-foreground">Carregando informações do plano...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header com botão voltar */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/dashboard')}
          className="hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Planos e Assinatura</h1>
          <p className="text-muted-foreground">
            Gerencie seu plano atual e explore opções de upgrade
          </p>
        </div>
      </div>

      {/* Current Plan Section */}
      {currentPlan && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Seu Plano Atual</h2>
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <CardTitle>{currentPlan.plan_name}</CardTitle>
                </div>
                <Badge variant="default">Ativo</Badge>
              </div>
              <CardDescription>
                Plano atual com todas as funcionalidades disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Produtos</p>
                  <p className="text-2xl font-bold">{currentPlan.max_products}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Saques processados em</p>
                  <p className="text-lg">{currentPlan.withdrawal_time}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Taxa de Transação</p>
                  <p className="text-lg">{currentPlan.transaction_fee}%</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Funcionalidades Incluídas:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Available Plans Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Planos Disponíveis</h2>
        <p className="text-muted-foreground">
          Escolha o plano que melhor se adapta às suas necessidades
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availablePlans.map((plan) => {
            const isCurrentPlan = currentPlan?.plan_name === plan.name;
            const IconComponent = planIcons[plan.name as keyof typeof planIcons] || Zap;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${isCurrentPlan ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Plano Atual
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">
                      {formatPrice(plan.price, plan.currency)}
                    </div>
                    <p className="text-sm text-muted-foreground">por mês</p>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Produtos</span>
                      <span className="font-medium">{plan.max_products}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Saques processados em</span>
                      <span className="font-medium">{plan.withdrawal_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Taxa</span>
                      <span className="font-medium">{plan.transaction_fee}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-success flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className="w-full" 
                    variant={isCurrentPlan ? "outline" : "default"}
                    disabled={isCurrentPlan}
                    onClick={() => handleUpgrade(plan.id, plan.name, plan.price)}
                  >
                    {isCurrentPlan ? 'Plano Atual' : 'Fazer Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}