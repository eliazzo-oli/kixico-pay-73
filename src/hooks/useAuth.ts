import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // When user signs in, mark profile as online and check status
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            // Fire and forget; RLS allows users to update their own profile
            setProfileOnlineStatus(session.user.id, 'online');
            checkUserStatus(session.user.id);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Check user status and mark as online for existing session
      if (session?.user) {
        setTimeout(() => {
          setProfileOnlineStatus(session.user.id, 'online');
          checkUserStatus(session.user.id);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserStatus = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('status, trial_end_date, plano_assinatura')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error checking user status:', error);
        return;
      }

      // Verificar se usuário está suspenso
      if (profile?.status === 'suspended' || profile?.status === 'suspenso') {
        toast.error('Sua conta foi suspensa. Entre em contato com o suporte.');
        await supabase.auth.signOut();
        return;
      }

      // Verificar se o trial expirou e não tem plano pago ativo
      if (profile?.trial_end_date) {
        const trialEndDate = new Date(profile.trial_end_date);
        const now = new Date();
        const isTrialExpired = now > trialEndDate;
        
        // Verificar se tem assinatura ativa e não expirada
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('status, expires_at')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();

        let hasValidSubscription = false;
        if (subscription?.expires_at) {
          const subscriptionExpiry = new Date(subscription.expires_at);
          hasValidSubscription = now <= subscriptionExpiry;
        }

        // Se o trial expirou e não tem assinatura válida nem plano diferente do básico
        if (isTrialExpired && !hasValidSubscription && (!profile.plano_assinatura || profile.plano_assinatura === 'basico')) {
          toast.error('Seu acesso expirou. Renove sua assinatura para continuar usando a plataforma.');
          await supabase.auth.signOut();
          return;
        }
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  };

  const setProfileOnlineStatus = async (userId: string, status: 'online' | 'offline') => {
    try {
      await supabase
        .from('profiles')
        .update({ status })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Check if user is suspended or trial expired after successful login
    if (!error && data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('status, trial_end_date, plano_assinatura')
        .eq('user_id', data.user.id)
        .single();
        
      if (profile?.status === 'suspended' || profile?.status === 'suspenso') {
        await supabase.auth.signOut();
        return { error: { message: 'Sua conta foi suspensa. Entre em contato com o suporte.' } };
      }

      // Verificar se o trial expirou e não tem plano pago válido
      if (profile?.trial_end_date) {
        const trialEndDate = new Date(profile.trial_end_date);
        const now = new Date();
        const isTrialExpired = now > trialEndDate;
        
        if (isTrialExpired) {
          // Verificar se tem assinatura ativa e não expirada
          const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('status, expires_at')
            .eq('user_id', data.user.id)
            .eq('status', 'active')
            .maybeSingle();

          let hasValidSubscription = false;
          if (subscription?.expires_at) {
            const subscriptionExpiry = new Date(subscription.expires_at);
            hasValidSubscription = now <= subscriptionExpiry;
          }

          // Se não tem assinatura válida nem plano diferente do básico
          if (!hasValidSubscription && (!profile.plano_assinatura || profile.plano_assinatura === 'basico')) {
            await supabase.auth.signOut();
            return { error: { message: 'Seu acesso expirou. Renove sua assinatura para continuar usando a plataforma.' } };
          }
        }
      }
    }
    
    return { error };
  };

  const signOut = async () => {
    // Mark profile as offline BEFORE signing out
    try {
      if (user?.id) {
        await setProfileOnlineStatus(user.id, 'offline');
      }
    } catch (error) {
      console.error('Error marking user offline:', error);
    }

    // Clear user presence before signing out
    try {
      const channels = supabase.getChannels();
      for (const channel of channels) {
        if (channel.topic.includes('online-users')) {
          await channel.untrack();
        }
      }
    } catch (error) {
      console.error('Error cleaning up presence:', error);
    }

    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };
}