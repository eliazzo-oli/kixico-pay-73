import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SaleNotification {
  id: string;
  amount: number;
  timestamp: Date;
}

export function useSaleNotifications() {
  const [notifications, setNotifications] = useState<SaleNotification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<SaleNotification | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time changes in transactions table
    const channel = supabase
      .channel('sale_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newTransaction = payload.new;
          const notification: SaleNotification = {
            id: newTransaction.id,
            amount: newTransaction.amount,
            timestamp: new Date()
          };
          
          setNotifications(prev => [...prev, notification]);
          setCurrentNotification(notification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedTransaction = payload.new;
          const oldTransaction = payload.old;
          
          // Only show notification if status changed to completed or paid
          if (
            oldTransaction.status !== updatedTransaction.status &&
            (updatedTransaction.status === 'completed' || updatedTransaction.status === 'paid')
          ) {
            const notification: SaleNotification = {
              id: updatedTransaction.id,
              amount: updatedTransaction.amount,
              timestamp: new Date()
            };
            
            setNotifications(prev => [...prev, notification]);
            setCurrentNotification(notification);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const dismissCurrentNotification = () => {
    setCurrentNotification(null);
  };

  return {
    notifications,
    currentNotification,
    dismissCurrentNotification
  };
}