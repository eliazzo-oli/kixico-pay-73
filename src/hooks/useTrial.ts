import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TrialStatus {
  isInTrial: boolean;
  trialEndDate: Date | null;
  daysRemaining: number;
  isExpired: boolean;
}

export function useTrial() {
  const { user } = useAuth();
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    isInTrial: false,
    trialEndDate: null,
    daysRemaining: 0,
    isExpired: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTrialStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchTrialStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('trial_end_date')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching trial status:', error);
        return;
      }

      if (data?.trial_end_date) {
        const trialEndDate = new Date(data.trial_end_date);
        const now = new Date();
        const diffTime = trialEndDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isExpired = now > trialEndDate;
        const isInTrial = !isExpired && daysRemaining >= 0;

        setTrialStatus({
          isInTrial,
          trialEndDate,
          daysRemaining: Math.max(0, daysRemaining),
          isExpired,
        });
      }
    } catch (error) {
      console.error('Error in fetchTrialStatus:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshTrialStatus = () => {
    if (user) {
      fetchTrialStatus();
    }
  };

  return {
    trialStatus,
    loading,
    refreshTrialStatus,
  };
}