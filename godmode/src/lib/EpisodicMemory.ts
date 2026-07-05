import { memoryVault } from "../server/db.js";

export interface EpisodicMemoryTriplet {
  id?: number;
  action: string;
  state: string;
  reward: number;
  timestamp?: string;
}

// Ensure table exists
try {
  memoryVault.prepare(`
    CREATE TABLE IF NOT EXISTS episodic_memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      state TEXT NOT NULL,
      reward REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
} catch (e) {
  console.warn("Could not create episodic_memories table. Running in ram/mock mode:", e);
}

export class EpisodicMemoryTracker {
  static logEpisode(action: string, state: any, reward: number) {
    const stateStr = typeof state === "string" ? state : JSON.stringify(state);
    console.log(`[EPISODIC MEMORY] Logging episode - Action: "${action.slice(0, 50)}...", Reward: ${reward}`);
    
    try {
      memoryVault.prepare(`
        INSERT INTO episodic_memories (action, state, reward)
        VALUES (?, ?, ?)
      `).run(action, stateStr, reward);
    } catch (error: any) {
      console.error("[EPISODIC MEMORY] Logging failed:", error.message);
    }
  }

  static getSuccessfulPlaybooks(minReward = 0.8, limit = 10): EpisodicMemoryTriplet[] {
    try {
      return memoryVault.prepare(`
        SELECT * FROM episodic_memories 
        WHERE reward >= ? 
        ORDER BY reward DESC, timestamp DESC 
        LIMIT ?
      `).all(minReward, limit) as EpisodicMemoryTriplet[];
    } catch (error: any) {
      console.warn("[EPISODIC MEMORY] Could not query successful playbooks:", error.message);
      return [];
    }
  }
}
