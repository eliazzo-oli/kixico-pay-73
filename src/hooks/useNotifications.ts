import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  message: string;
  sender: string;
  read: boolean;
  created_at: string;
  user_id: string | null;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userRegistrationDate, setUserRegistrationDate] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    async function fetchNotifications() {
      try {
        // Primeiro buscar a data de registro do usuário
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;

        const registrationDate = profileData?.created_at;
        setUserRegistrationDate(registrationDate);

        // Buscar notificações pessoais e globais criadas após o registro
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .or(`user_id.eq.${user.id},and(user_id.is.null,created_at.gte.${registrationDate})`)
          .order('created_at', { ascending: false })
          .limit(20);

        if (notificationsError) throw notificationsError;

        // Buscar status de leitura para notificações globais
        const { data: readStatusData, error: readStatusError } = await supabase
          .from('notification_read_status')
          .select('notification_id')
          .eq('user_id', user.id);

        if (readStatusError) throw readStatusError;

        const readGlobalNotifications = new Set(readStatusData?.map(rs => rs.notification_id) || []);

        // Marcar notificações como lidas baseado no status
        const processedNotifications = (notificationsData || []).map(notification => ({
          ...notification,
          read: notification.user_id === user.id 
            ? notification.read 
            : readGlobalNotifications.has(notification.id)
        }));
        
        setNotifications(processedNotifications);
        setUnreadCount(processedNotifications.filter(n => !n.read).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    }

    fetchNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id},user_id=is.null`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Verificar se a notificação deve ser exibida para este usuário
          const shouldShowNotification = newNotification.user_id === user.id || 
            (newNotification.user_id === null && userRegistrationDate && 
             new Date(newNotification.created_at) >= new Date(userRegistrationDate));
          
          if (shouldShowNotification) {
            setNotifications(prev => [newNotification, ...prev.slice(0, 19)]);
            
            if (!newNotification.read) {
              setUnreadCount(prev => prev + 1);
            }
            
            // Show toast for new notification
            toast({
              title: newNotification.sender,
              description: newNotification.message,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id},user_id=is.null`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          const oldNotification = payload.old as Notification;
          
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
          
          // Update unread count if read status changed
          if (oldNotification.read !== updatedNotification.read) {
            if (updatedNotification.read && !oldNotification.read) {
              // Notification was marked as read
              setUnreadCount(prev => Math.max(0, prev - 1));
            } else if (!updatedNotification.read && oldNotification.read) {
              // Notification was marked as unread
              setUnreadCount(prev => prev + 1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;

      if (notification.user_id === user.id) {
        // Notificação pessoal - atualizar diretamente
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Notificação global - registrar como lida
        const { error } = await supabase
          .from('notification_read_status')
          .upsert({
            user_id: user.id,
            notification_id: notificationId
          });

        if (error) throw error;

        // Atualizar estado local
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    console.log('markAllAsRead chamado');
    console.log('Notificações atuais:', notifications);
    console.log('Contagem não lidas atual:', unreadCount);

    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      console.log('Notificações não lidas encontradas:', unreadNotifications);
      
      if (unreadNotifications.length === 0) {
        console.log('Nenhuma notificação não lida encontrada');
        return;
      }

      // Separar notificações pessoais e globais
      const personalNotifications = unreadNotifications.filter(n => n.user_id === user.id);
      const globalNotifications = unreadNotifications.filter(n => n.user_id === null);

      console.log('Notificações pessoais:', personalNotifications);
      console.log('Notificações globais:', globalNotifications);

      // Marcar notificações pessoais como lidas
      if (personalNotifications.length > 0) {
        console.log('Marcando notificações pessoais como lidas...');
        const { error: personalError } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user.id)
          .eq('read', false);

        if (personalError) {
          console.error('Erro ao marcar notificações pessoais:', personalError);
          throw personalError;
        }
        console.log('Notificações pessoais marcadas como lidas');
      }

      // Registrar notificações globais como lidas
      if (globalNotifications.length > 0) {
        console.log('Registrando notificações globais como lidas...');
        const readStatusRecords = globalNotifications.map(notification => ({
          user_id: user.id,
          notification_id: notification.id
        }));

        console.log('Registros de status:', readStatusRecords);

        const { error: globalError } = await supabase
          .from('notification_read_status')
          .upsert(readStatusRecords);

        if (globalError) {
          console.error('Erro ao registrar notificações globais:', globalError);
          throw globalError;
        }
        console.log('Notificações globais registradas como lidas');
      }

      // Atualizar estado local
      console.log('Atualizando estado local...');
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      console.log('Estado local atualizado - contagem deve ser 0');

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}