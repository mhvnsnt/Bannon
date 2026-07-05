import { useEffect, useState } from 'react';

export function useNexusIPC() {
  const [status, setStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'ONLINE'>('DISCONNECTED');
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    let ws: WebSocket;
    
    const connect = () => {
      setStatus('CONNECTING');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[NexusIPC] Connected');
        setStatus('ONLINE');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'BRIDGE_STATUS') {
            setStatus(data.status);
          }
          setMessages(prev => [...prev, data].slice(-100));
        } catch (err) {
          console.error('[NexusIPC] Message parse error', err);
        }
      };

      ws.onclose = () => {
        setStatus('DISCONNECTED');
        setTimeout(connect, 2000);
      };
      
      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, []);

  return { status, messages };
}
