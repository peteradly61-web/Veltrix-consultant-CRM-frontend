import { useEffect, useState } from 'react';
import { useVeltrixStore } from '@/lib/store';

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
  const addRealtimeLog = useVeltrixStore((state) => state.addRealtimeLog);

  useEffect(() => {
    // 1. Initial hydration fetch from local API endpoint
    async function fetchUnassignedLeads() {
      try {
        const res = await fetch('/api/leads/list');
        const json = await res.json();
        if (json.success && json.data) {
          setUnassignedLeads(json.data);
        }
      } catch (err) {
        console.error('[useLiveLeads] Exception fetching unassigned leads:', err);
      }
    }

    fetchUnassignedLeads();

    // 2. Local Server-Sent Events (SSE) stream client subscription
    let eventSource: EventSource | null = null;
    
    try {
      eventSource = new EventSource('/api/leads/stream');
      
      eventSource.onmessage = (event) => {
        try {
          if (event.data) {
            const newLead = JSON.parse(event.data) as DatabaseLead;
            
            // 3. State Appending Logic: Prepend the new record
            let isNew = false;
            setUnassignedLeads((prev) => {
              // Deduplicate in state
              if (prev.some(lead => lead.contact_email.toLowerCase() === newLead.contact_email.toLowerCase())) {
                return prev;
              }
              isNew = true;
              return [newLead, ...prev];
            });

            // 4. Visual Event Signaling & Console Ingestion Log
            if (isNew) {
              setIsLiveStreaming(true);
              addRealtimeLog(
                `[Ingestion Stream] Real-time lead captured: ${newLead.company_name} (${newLead.contact_email})`,
                'success'
              );
            }
          }
        } catch (e) {
          console.error('[useLiveLeads] SSE parsing error:', e);
        }
      };

      eventSource.onerror = (err) => {
        console.warn('[useLiveLeads] SSE stream disconnected or encountered an error. Attempting reconnect...', err);
      };
    } catch (sseErr) {
      console.error('[useLiveLeads] Exception setting up SSE:', sseErr);
    }

    // 5. Cleanup: Terminate SSE client connection if component unmounts
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [addRealtimeLog]);

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
