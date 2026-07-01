import { EventEmitter } from 'events';

class SSEBroadcaster extends EventEmitter {
  private static instance: SSEBroadcaster;
  
  public static getInstance(): SSEBroadcaster {
    if (!SSEBroadcaster.instance) {
      SSEBroadcaster.instance = new SSEBroadcaster();
      SSEBroadcaster.instance.setMaxListeners(100);
    }
    return SSEBroadcaster.instance;
  }
  
  public broadcastLead(lead: any) {
    this.emit('lead', lead);
  }
}

export const sseBroadcaster = SSEBroadcaster.getInstance();
