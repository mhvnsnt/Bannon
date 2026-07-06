import axios from 'axios';

export function startImmortalHeartbeat() {
  console.log("🟢 Initializing CODEDUMMY Immortal Heartbeat...");

  setInterval(async () => {
    try {
      // 1. Log the pulse to keep the Node event loop active
      console.log(`[${new Date().toISOString()}] Agent Pulse Active.`);
      
      // 2. Force an outbound network request to bypass infrastructure sleep protocols
      await axios.get('https://worldtimeapi.org/api/timezone/Etc/UTC');
      
    } catch (e) {
      console.error("Heartbeat network ping failed, but process remains alive.");
    }
  }, 1000 * 60 * 5); // Fires exactly every 5 minutes
}
