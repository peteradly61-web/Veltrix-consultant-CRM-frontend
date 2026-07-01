import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface DatabaseLead {
  id: string;
  company_name: string | null;
  contact_email: string;
  contact_name: string;
  title: string;
  industry: string;
  data_pool_name: string;
  status: string;
  created_at: string;
}

export function useLiveLeads() {
  const [unassignedLeads, setUnassignedLeads] = useState<DatabaseLead[]>([]);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);

  useEffect(() => {
    // 1. Hydration Fetch: Get all leads where status === 'unassigned', sorted chronologically with newest at the top
    async function fetchUnassignedLeads() {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('status', 'unassigned')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[useLiveLeads] Error fetching unassigned leads:', error);
        } else if (data) {
          setUnassignedLeads(data);
        }
      } catch (err) {
        console.error('[useLiveLeads] Exception fetching unassigned leads:', err);
      }
    }

    fetchUnassignedLeads();

    // 2. WebSocket Channel Provisioning: subscribe to PostgreSQL write-ahead log for public.leads
    const channel = supabase
      .channel('live-scraper-stream')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: 'status=eq.unassigned',
        },
        (payload) => {
          const newLead = payload.new as DatabaseLead;
          
          // 3. State Appending Logic: Prepend the new record to the top of unassignedLeads
          setUnassignedLeads((prev) => [newLead, ...prev]);

          // 4. Visual Event Signaling: Set flag to true to start flashing indicators
          setIsLiveStreaming(true);
        }
      )
      .subscribe();

    // 5. Cleanup: Terminate and drop WebSocket channel connection if the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle the automatic 1000ms delay to reset the flash status
  useEffect(() => {
    if (isLiveStreaming) {
      const timer = setTimeout(() => {
        setIsLiveStreaming(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLiveStreaming]);

  return { unassignedLeads, isLiveStreaming };
}
