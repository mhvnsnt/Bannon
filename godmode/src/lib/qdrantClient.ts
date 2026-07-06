import { QdrantClient } from '@qdrant/js-client-rest';

export interface PerformanceMetric {
  successProbability: number;
  entropyScore: number;
  convergenceTimeMs: number;
}

export interface MutationRecord {
  id: string;
  agentId: string;
  timestamp: string;
  mutationType: string;
  codeHypothesis: string;
  metrics: PerformanceMetric;
  success: boolean;
}

export class QdrantVectorClient {
  private client: QdrantClient;
  private collectionName = 'darwinian_mutations';

  constructor() {
    this.client = new QdrantClient({ host: 'localhost', port: 6333 });
  }

  async init() {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(c => c.name === this.collectionName);
      
      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: { size: 384, distance: 'Cosine' }
        });
        console.log(`[Qdrant] Collection ${this.collectionName} initialized.`);
      }
    } catch (e) {
      console.warn("[Qdrant] Failed to connect or initialize.", e);
    }
  }

  // Very naive hash/embedding simulator for the sake of local OS without a true embedding model right now
  private generateMockEmbedding(text: string): number[] {
    const vec = new Array(384).fill(0.0);
    for (let i = 0; i < text.length; i++) {
      vec[i % 384] += text.charCodeAt(i) / 1000.0;
    }
    // Normalize
    const mag = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
    return vec.map(v => mag > 0 ? v / mag : 0);
  }

  async storeMutationLog(record: MutationRecord) {
    try {
      const vector = this.generateMockEmbedding(`${record.mutationType} ${record.codeHypothesis}`);
      
      await this.client.upsert(this.collectionName, {
        wait: true,
        points: [
          {
            id: record.id,
            vector: vector,
            payload: {
              agentId: record.agentId,
              timestamp: record.timestamp,
              mutationType: record.mutationType,
              codeHypothesis: record.codeHypothesis,
              successProbability: record.metrics.successProbability,
              entropyScore: record.metrics.entropyScore,
              convergenceTimeMs: record.metrics.convergenceTimeMs,
              success: record.success
            }
          }
        ]
      });
      console.log(`[Qdrant] Stored mutation log ${record.id}`);
    } catch (e) {
      console.error("[Qdrant] Failed to store mutation log.", e);
    }
  }

  async retrieveRelevantHistory(queryStr: string, limit: number = 3): Promise<MutationRecord[]> {
    try {
      const vector = this.generateMockEmbedding(queryStr);
      
      const results = await this.client.search(this.collectionName, {
        vector: vector,
        limit: limit,
        with_payload: true
      });

      return results.map(r => ({
        id: String(r.id),
        agentId: String(r.payload?.agentId),
        timestamp: String(r.payload?.timestamp),
        mutationType: String(r.payload?.mutationType),
        codeHypothesis: String(r.payload?.codeHypothesis),
        metrics: {
          successProbability: Number(r.payload?.successProbability),
          entropyScore: Number(r.payload?.entropyScore),
          convergenceTimeMs: Number(r.payload?.convergenceTimeMs)
        },
        success: Boolean(r.payload?.success)
      }));
    } catch (e) {
      console.error("[Qdrant] Failed to retrieve history.", e);
      return [];
    }
  }
}
