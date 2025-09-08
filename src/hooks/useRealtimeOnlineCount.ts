import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeOnlineCount() {
  const [onlineCount, setOnlineCount] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchOnlineCount = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'online');
      if (error) {
        console.error('Error fetching online count:', error);
        return;
      }
      setOnlineCount(count ?? 0);
    } catch (err) {
      console.error('Unexpected error fetching online count:', err);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchOnlineCount();

    // Subscribe to realtime changes on profiles table
    const channel = supabase
      .channel('profiles-online-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => {
        fetchOnlineCount();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        // Only refresh if status potentially changed
        // Lightweight safeguard: if status field appears in changes, refetch
        // But even if not detected, a refetch is cheap enough
        fetchOnlineCount();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'profiles' }, () => {
        fetchOnlineCount();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Ensure we have the latest count right after subscription
          fetchOnlineCount();
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return { onlineCount };
}
