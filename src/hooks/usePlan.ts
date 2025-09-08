import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useTrial } from './useTrial';


export type PlanType = 'basico' | 'profissional' | 'empresarial';

export interface PlanFeatures {
  maxProducts: number;
  hasAdvancedReports: boolean;
  hasApiAccess: boolean;
  hasInstantWithdrawals: boolean;
  hasAdvancedAnalytics: boolean;
  hasEnterpriseReports: boolean;
  hasAdvancedDashboard: boolean;
  hasCustomerInsights: boolean;
  hasPrioritySupport: boolean;
  withdrawalTime: string;
  withdrawalFee: number;
  price: number;
}

const planFeatures: Record<PlanType, PlanFeatures> = {
  basico: {
    maxProducts: 2,
    hasAdvancedReports: false,
    hasApiAccess: false,
    hasInstantWithdrawals: false,
    hasAdvancedAnalytics: false,
    hasEnterpriseReports: false,
    hasAdvancedDashboard: false,
    hasCustomerInsights: false,
    hasPrioritySupport: false,
    withdrawalTime: '24 horas',
    withdrawalFee: 10,
    price: 4900,
  },
  profissional: {
    maxProducts: 5,
    hasAdvancedReports: true,
    hasApiAccess: false,
    hasInstantWithdrawals: false,
    hasAdvancedAnalytics: true,
    hasEnterpriseReports: false,
    hasAdvancedDashboard: true,
    hasCustomerInsights: true,
    hasPrioritySupport: true,
    withdrawalTime: '12 horas',
    withdrawalFee: 5,
    price: 14900,
  },
  empresarial: {
    maxProducts: Infinity,
    hasAdvancedReports: true,
    hasApiAccess: true,
    hasInstantWithdrawals: true,
    hasAdvancedAnalytics: true,
    hasEnterpriseReports: true,
    hasAdvancedDashboard: true,
    hasCustomerInsights: true,
    hasPrioritySupport: true,
    withdrawalTime: 'Instantâneo',
    withdrawalFee: 0,
    price: 49900,
  },
};

export function usePlan() {
  const { user } = useAuth();
  const { trialStatus } = useTrial();
  const [currentPlan, setCurrentPlan] = useState<PlanType>('basico');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserPlan();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plano_assinatura')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user plan:', error);
        return;
      }

      if (data?.plano_assinatura) {
        setCurrentPlan(data.plano_assinatura as PlanType);
      }
    } catch (error) {
      console.error('Error in fetchUserPlan:', error);
    } finally {
      setLoading(false);
    }
  };

  // Durante o trial, usuário tem funcionalidades do plano Profissional
  const effectivePlan = trialStatus.isInTrial ? 'profissional' : currentPlan;
  const features = planFeatures[effectivePlan];

  const canCreateProduct = async (currentProductCount: number): Promise<boolean> => {
    return currentProductCount < features.maxProducts;
  };

  const hasFeature = (feature: keyof PlanFeatures): boolean => {
    return Boolean(features[feature]);
  };

  const getPlanDisplayName = (plan: PlanType): string => {
    switch (plan) {
      case 'basico':
        return 'Básico';
      case 'profissional':
        return 'Profissional';
      case 'empresarial':
        return 'Empresarial';
      default:
        return 'Básico';
    }
  };

  return {
    currentPlan,
    features,
    loading,
    canCreateProduct,
    hasFeature,
    getPlanDisplayName,
    refreshPlan: fetchUserPlan,
  };
}