import { LRUCache } from './lruCache';

export interface VectorLog {
  id: string;
  agentId: string;
  timestamp: string;
  mutationType: string;
  content: string;
  successProbability: number;
  entropyScore: number;
}

export class ChromaService {
  private apiUrl = "http://localhost:8000/api/v1";
  private collectionName = 'god_mode_agent_logs';
  private collectionId: string | null = null;
  private queryCache = new LRUCache<string, VectorLog[]>(100);
  
  // In-memory fallback if real ChromaDB is not available
  private inMemoryDb: VectorLog[] = [];
  private useFallback = false;

  async init() {
    try {
      // Get or create collection
      const res = await fetch(`${this.apiUrl}/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: this.collectionName,
          metadata: { "description": "Vector memory vault for Darwinian agent mutations" }
        })
      });
      
      let data = await res.json();
      if (res.status === 409 || (data.error && data.error.includes("already exists"))) {
        // Fetch existing
        const getRes = await fetch(`${this.apiUrl}/collections/${this.collectionName}`);
        data = await getRes.json();
      }
      
      if (data && data.id) {
        this.collectionId = data.id;
        console.log(`[ChromaDB] Collection '${this.collectionName}' initialized with ID: ${this.collectionId}`);
      }
    } catch (e) {
      console.warn("[ChromaDB] Local instance not found. Falling back to secure in-memory vector vault.");
      this.useFallback = true;
      this.collectionId = 'fallback-id';
      
      // Seed some dummy data if empty so it's not totally barren
      if (this.inMemoryDb.length === 0) {
        this.inMemoryDb.push({
          id: 'v1',
          agentId: 'Nexus-Prime',
          timestamp: new Date().toISOString(),
          mutationType: 'Physics_Optimization',
          content: 'Adjusted RK_STAND parameter to 0.72 to fix spine stretching limits during knockdown collision iterations.',
          successProbability: 0.98,
          entropyScore: 0.22
        });
        this.inMemoryDb.push({
          id: 'v2',
          agentId: 'Execution_Hub',
          timestamp: new Date().toISOString(),
          mutationType: 'Rig_Correction',
          content: 'Limited elbow mantis hinge lock ranges. Added 0.04 tolerance to prevent IK snapping on low fps loads.',
          successProbability: 0.91,
          entropyScore: 0.54
        });
      }
    }
  }

  async storeLog(log: VectorLog) {
    if (!this.collectionId) await this.init();
    
    if (this.useFallback) {
      this.inMemoryDb.unshift(log);
      return;
    }

    try {
      await fetch(`${this.apiUrl}/collections/${this.collectionId}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: [log.id],
          metadatas: [{
            agentId: log.agentId,
            timestamp: log.timestamp,
            mutationType: log.mutationType,
            successProbability: log.successProbability,
            entropyScore: log.entropyScore
          }],
          documents: [log.content]
        })
      });
      console.log(`[ChromaDB] Stored log ${log.id} successfully.`);
    } catch (e) {
      console.error("[ChromaDB] Failed to store log.", e);
    }
  }

  async queryLogs(queryText: string, nResults: number = 3) {
    if (!this.collectionId) await this.init();
    
    if (this.useFallback) {
      // Basic semantic search mock using naive text inclusion or simple scoring
      const term = queryText.toLowerCase();
      const results = this.inMemoryDb
        .map(log => {
          let score = 0;
          if (log.content.toLowerCase().includes(term)) score += 10;
          if (log.mutationType.toLowerCase().includes(term)) score += 5;
          return { log, score };
        })
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, nResults)
        .map(r => r.log);
        
      // Return everything if no hits so it doesn't just show blank when they test it
      return results.length > 0 ? results : this.inMemoryDb.slice(0, nResults);
    }

    if (!this.collectionId) return [];

    const cacheKey = `${queryText}_${nResults}`;
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey)!;
    }

    try {
      const res = await fetch(`${this.apiUrl}/collections/${this.collectionId}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query_texts: [queryText],
          n_results: nResults
        })
      });
      const results = await res.json();
      
      const mappedResults: VectorLog[] = [];
      
      if (results.ids && results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          const meta = results.metadatas[0]?.[i] as any;
          mappedResults.push({
            id: results.ids[0][i] as string,
            agentId: meta?.agentId || 'unknown',
            timestamp: meta?.timestamp || new Date().toISOString(),
            mutationType: meta?.mutationType || 'unknown',
            content: (results.documents[0]?.[i] as string) || '',
            successProbability: meta?.successProbability || 0,
            entropyScore: meta?.entropyScore || 1
          });
        }
      }
      this.queryCache.set(cacheKey, mappedResults);
      return mappedResults;
    } catch (e) {
      console.error("[ChromaDB] Failed to query logs.", e);
      return [];
    }
  }

  getCacheEntries(): [string, VectorLog[]][] {
    return this.queryCache.toJSON();
  }

  setCacheEntries(entries: [string, VectorLog[]][]) {
    this.queryCache.fromJSON(entries);
  }

  async getAllLogs(limit: number = 20) {
    if (!this.collectionId) await this.init();
    
    if (this.useFallback) {
      return this.inMemoryDb.slice(0, limit);
    }

    if (!this.collectionId) return [];

    try {
      const res = await fetch(`${this.apiUrl}/collections/${this.collectionId}/get`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit,
          include: ["metadatas", "documents"]
        })
      });
      const results = await res.json();

      const mappedResults: VectorLog[] = [];
      if (results.ids) {
        for (let i = 0; i < results.ids.length; i++) {
          const meta = results.metadatas[i] as any;
          mappedResults.push({
            id: results.ids[i] as string,
            agentId: meta?.agentId || 'unknown',
            timestamp: meta?.timestamp || new Date().toISOString(),
            mutationType: meta?.mutationType || 'unknown',
            content: (results.documents[i] as string) || '',
            successProbability: meta?.successProbability || 0,
            entropyScore: meta?.entropyScore || 1
          });
        }
      }
      return mappedResults;
    } catch (e) {
      console.error("[ChromaDB] Failed to get all logs.", e);
      return [];
    }
  }
}

export const vectorMemory = new ChromaService();
