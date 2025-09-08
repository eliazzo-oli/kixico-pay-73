import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface OnlineUser {
  user_id: string;
  user_email: string;
  user_name: string;
  online_at: string;
}

export function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const { user } = useAuth();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user) {
      setOnlineUsers([]);
      setOnlineCount(0);
      return;
    }

    // Use a unique channel name that includes timestamp to ensure fresh connections
    const channelName = `online-users-${Date.now()}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: user.id }
      }
    });
    
    channelRef.current = channel;

    const updateOnlineUsers = (presenceState: any) => {
      const users: OnlineUser[] = [];
      
      Object.keys(presenceState).forEach(userId => {
        const presences = presenceState[userId];
        if (presences && presences.length > 0) {
          // Use the most recent presence for each user
          const presence = presences[0] as any;
          const userData: OnlineUser = {
            user_id: presence.user_id || userId,
            user_email: presence.user_email || '',
            user_name: presence.user_name || presence.user_email || 'Usuário',
            online_at: presence.online_at || new Date().toISOString()
          };
          users.push(userData);
        }
      });
      
      console.log('Updating online users:', users.length, users);
      setOnlineUsers(users);
      setOnlineCount(users.length);
    };

    // Listen to presence events
    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        console.log('Presence sync event:', newState);
        updateOnlineUsers(newState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined online:', key, newPresences);
        const currentState = channel.presenceState();
        updateOnlineUsers(currentState);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left online:', key, leftPresences);
        const currentState = channel.presenceState();
        updateOnlineUsers(currentState);
      })
      .subscribe(async (status) => {
        console.log('Channel subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          // Track current user as online with retry logic
          const userStatus = {
            user_id: user.id,
            user_email: user.email || '',
            user_name: user.user_metadata?.name || user.email || 'Usuário',
            online_at: new Date().toISOString(),
          };

          try {
            const trackResult = await channel.track(userStatus);
            console.log('User tracking result:', trackResult);
          } catch (error) {
            console.error('Error tracking user presence:', error);
          }
        }
      });

    // Cleanup function
    return () => {
      console.log('Cleaning up presence channel');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user]);

  return {
    onlineUsers,
    onlineCount,
  };
}