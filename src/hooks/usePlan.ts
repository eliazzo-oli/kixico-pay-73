import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

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
  hasOrderBump: boolean;
  withdrawalTime: string;
  withdrawalFee: number;
  price: number;
}

export type PlanType = 'gratuito' | 'basico' | 'profissional' | 'empresarial';

// Plataforma 100% gratuita - apenas taxas de saque (10%) e 50 AOA por venda
const planFeatures: Record<PlanType, PlanFeatures> = {
  gratuito: {
    maxProducts: Infinity,
    hasAdvancedReports: true,
    hasApiAccess: true,
    hasInstantWithdrawals: true,
    hasAdvancedAnalytics: true,
    hasEnterpriseReports: true,
    hasAdvancedDashboard: true,
    hasCustomerInsights: true,
    hasPrioritySupport: true,
    hasOrderBump: true,
    withdrawalTime: 'Instantâneo',
    withdrawalFee: 10, // 10% de taxa de saque + 50 AOA por venda
    price: 0,
  },
  basico: {
    maxProducts: Infinity,
    hasAdvancedReports: true,
    hasApiAccess: true,
    hasInstantWithdrawals: true,
    hasAdvancedAnalytics: true,
    hasEnterpriseReports: true,
    hasAdvancedDashboard: true,
    hasCustomerInsights: true,
    hasPrioritySupport: true,
    hasOrderBump: true,
    withdrawalTime: 'Instantâneo',
    withdrawalFee: 10,
    price: 0,
  },
  profissional: {
    maxProducts: Infinity,
    hasAdvancedReports: true,
    hasApiAccess: true,
    hasInstantWithdrawals: true,
    hasAdvancedAnalytics: true,
    hasEnterpriseReports: true,
    hasAdvancedDashboard: true,
    hasCustomerInsights: true,
    hasPrioritySupport: true,
    hasOrderBump: true,
    withdrawalTime: 'Instantâneo',
    withdrawalFee: 10,
    price: 0,
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
    hasOrderBump: true,
    withdrawalTime: 'Instantâneo',
    withdrawalFee: 10,
    price: 0,
  },
};

export function usePlan() {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<PlanType>('gratuito');
  const [loading, setLoading] = useState(false);

  // Plataforma 100% gratuita - todos têm acesso completo
  const features = planFeatures['gratuito'];

  const canCreateProduct = async (currentProductCount: number): Promise<boolean> => {
    return true; // Sem limites
  };

  const hasFeature = (feature: keyof PlanFeatures): boolean => {
    return Boolean(features[feature]);
  };

  const getPlanDisplayName = (plan: PlanType): string => {
    return 'Gratuito';
  };

  const refreshPlan = () => {
    // No-op - plataforma gratuita
  };

  return {
    currentPlan: 'gratuito' as PlanType,
    features,
    loading,
    canCreateProduct,
    hasFeature,
    getPlanDisplayName,
    refreshPlan,
  };
}
