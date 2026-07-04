import { useEffect, useState } from 'react';

export function useLivingNexus() {
  const [bridgeStatus, setBridgeStatus] = useState('OFFLINE');
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Dynamically grab the URL and switch to secure websockets
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; 
    
    // We serve the app and API on the same port in all environments
    const wsUrl = `${protocol}//${host}`;
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setBridgeStatus('ONLINE');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'BRIDGE_STATUS') {
          setBridgeStatus(data.status);
        }
        // Handle incoming scraped data, market alerts, etc.
      } catch (e) {}
    };

    ws.onclose = () => {
      setBridgeStatus('OFFLINE');
      // Auto-reconnect logic goes here
    };

    setSocket(ws);

    return () => ws.close();
  }, []);

  return { bridgeStatus, socket };
}
