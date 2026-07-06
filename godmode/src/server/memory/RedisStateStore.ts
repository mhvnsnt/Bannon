export class RedisStateStore {
  private stateMap: Map<string, any> = new Map();

  constructor() {
    console.log("[RedisStateStore] Initializing Redis-backed session manager (Mocking redis connection for now).");
  }

  async getSession(id: string): Promise<any> {
    return this.stateMap.get(id) || null;
  }

  async saveSession(id: string, state: any): Promise<void> {
    this.stateMap.set(id, state);
    console.log(`[RedisStateStore] Session ${id} saved to Redis.`);
  }

  async clearSession(id: string): Promise<void> {
    this.stateMap.delete(id);
    console.log(`[RedisStateStore] Session ${id} cleared from Redis.`);
  }
}

export const redisStateStore = new RedisStateStore();
