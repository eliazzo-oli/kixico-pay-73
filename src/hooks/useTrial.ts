import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface TrialStatus {
  isInTrial: boolean;
  trialEndDate: Date | null;
  daysRemaining: number;
  isExpired: boolean;
}

// Plataforma 100% gratuita - sem trial
export function useTrial() {
  const { user } = useAuth();
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    isInTrial: false,
    trialEndDate: null,
    daysRemaining: 0,
    isExpired: false,
  });
  const [loading, setLoading] = useState(false);

  // Plataforma gratuita - não há trial
  const refreshTrialStatus = () => {
    // No-op - plataforma gratuita
  };

  return {
    trialStatus,
    loading,
    refreshTrialStatus,
  };
}
