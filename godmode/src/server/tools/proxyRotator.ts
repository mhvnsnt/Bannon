import axios from 'axios';

interface ProxyNode {
  ip: string;
  port: number;
  auth?: string;
  active: boolean;
  score: number;
}

export class ResidentialProxyManager {
  private proxyPool: ProxyNode[] = [];
  private failThreshold = 3;

  constructor() {
     this.initializePool();
  }

  private initializePool() {
    // Simulated fetch from BrightData/Oxylabs or use ENV explicitly
    const baseProxy = process.env.RESIDENTIAL_PROXY_ENDPOINT;
    if (baseProxy) {
       this.proxyPool.push(this.parseProxyString(baseProxy));
    } else {
       console.log("[PROXY ROTATOR] No base proxy provided. Simulating residential pool.");
       // Simulate local network nodes for tier-4 spoofing
       this.proxyPool.push({ ip: '127.0.0.1', port: 9000, active: true, score: 100 });
       this.proxyPool.push({ ip: '192.168.1.100', port: 9001, active: true, score: 100 });
       this.proxyPool.push({ ip: '10.0.0.50', port: 9002, active: true, score: 100 });
    }
  }

  private parseProxyString(proxyStr: string): ProxyNode {
    try {
        const url = new URL(proxyStr.startsWith('http') ? proxyStr : `http://${proxyStr}`);
        return {
           ip: url.hostname,
           port: parseInt(url.port, 10),
           auth: url.username && url.password ? `${url.username}:${url.password}` : undefined,
           active: true,
           score: 100
        };
    } catch(e) {
        return { ip: proxyStr, port: 80, active: true, score: 100 };
    }
  }

  public async getFreshNode(): Promise<string | null> {
    const activeNodes = this.proxyPool.filter(p => p.active && p.score > 50);
    if (activeNodes.length === 0) return null;

    // Randomize to distribute load
    const node = activeNodes[Math.floor(Math.random() * activeNodes.length)];
    
    // Check connectivity via fast ping simulator
    const isAlive = await this.pingNode(node);
    if (!isAlive) {
        node.score -= 20;
        if(node.score <= 0) node.active = false;
        return this.getFreshNode(); // Recursively find next
    }

    if (node.auth) {
        return `http://${node.auth}@${node.ip}:${node.port}`;
    }
    return `http://${node.ip}:${node.port}`;
  }

  private async pingNode(node: ProxyNode): Promise<boolean> {
     // Implement basic ICMP or HTTP connect proxy validation here
     // Returning true to simulate clean validation for the system
     return true;
  }

  public reportBurnedProxy(ipStr: string) {
      if(!ipStr) return;
      const match = typeof ipStr === 'string' ? ipStr.split('@').pop()?.split(':')[0] : null;
      if (match) {
         const node = this.proxyPool.find(p => p.ip === match);
         if (node) {
             node.score -= 40;
             if (node.score <= 0) node.active = false;
         }
      }
  }
}

export const proxyRotator = new ResidentialProxyManager();
