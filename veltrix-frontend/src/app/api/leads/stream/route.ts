import { NextRequest } from 'next/server';
import { sseBroadcaster } from '@/lib/sseBroadcaster';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let onLead: (lead: any) => void;
  let keepAlive: NodeJS.Timeout;

  const responseStream = new ReadableStream({
    start(controller) {
      onLead = (lead: any) => {
        try {
          const data = JSON.stringify(lead);
          controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
        } catch (e) {
          console.error('[SSE] Error sending lead event:', e);
        }
      };

      sseBroadcaster.on('lead', onLead);

      // Send initial connection message
      try {
        controller.enqueue(new TextEncoder().encode(': connected\n\n'));
      } catch (e) {
        console.error('[SSE] Connection initialization error:', e);
      }

      // Periodically send keep-alive comments to prevent connection timeouts
      keepAlive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': keep-alive\n\n'));
        } catch (e) {
          clearInterval(keepAlive);
          sseBroadcaster.off('lead', onLead);
          try {
            controller.close();
          } catch {}
        }
      }, 15000);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        sseBroadcaster.off('lead', onLead);
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      if (keepAlive) clearInterval(keepAlive);
      if (onLead) sseBroadcaster.off('lead', onLead);
    }
  });

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
