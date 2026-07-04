import { memoryVault } from './db';
import { EmbeddingEngine } from './embeddingEngine';
import crypto from 'crypto';

export interface ExperimentalDataLog {
  id?: string;
  category: 'interaction' | 'social' | 'financial' | 'strategy';
  description: string;
  outcome: string;
  risk_level: 'low' | 'medium' | 'high' | 'extreme';
  ai_prediction: string;
  actual_result: string;
  lessons_learned: string;
  timestamp?: string;
}

export class ExperimentalFeedback {
  static init() {
    // Ensure table exists
    const sql = `CREATE TABLE IF NOT EXISTS experimental_data_log (
      id TEXT PRIMARY KEY,
      category TEXT,
      description TEXT,
      outcome TEXT,
      risk_level TEXT,
      ai_prediction TEXT,
      actual_result TEXT,
      lessons_learned TEXT,
      embedding BLOB,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`;
    memoryVault.prepare(sql).run();
    console.log('[ExperimentalFeedback] Initialized Experimental Feedback Engine.');
  }

  static async logExperiment(data: ExperimentalDataLog): Promise<string> {
    const id = data.id || crypto.randomUUID();
    
    // Combine fields for semantic embedding
    const textToEmbed = `
      Category: ${data.category}
      Description: ${data.description}
      Prediction: ${data.ai_prediction}
      Actual Result: ${data.actual_result}
      Outcome: ${data.outcome}
      Risk Level: ${data.risk_level}
      Lessons Learned: ${data.lessons_learned}
    `;

    // Generate vector embedding
    const embeddingArray = await EmbeddingEngine.embed(textToEmbed);
    const embeddingBuffer = Buffer.from(new Float32Array(embeddingArray).buffer);

    const stmt = memoryVault.prepare(`
      INSERT OR REPLACE INTO experimental_data_log (
        id, category, description, outcome, risk_level, ai_prediction, actual_result, lessons_learned, embedding
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.category,
      data.description,
      data.outcome,
      data.risk_level,
      data.ai_prediction,
      data.actual_result,
      data.lessons_learned,
      embeddingBuffer
    );

    console.log(`[ExperimentalFeedback] Logged new experiment ${id} [${data.category}]`);
    return id;
  }

  static async queryHistoricalFeedback(query: string, limit: number = 5) {
    const queryEmbedding = await EmbeddingEngine.embed(query);
    
    const rows = memoryVault.prepare(`SELECT * FROM experimental_data_log`).all() as any[];
    
    const candidates = rows.map(row => {
      let embedding: number[] = [];
      if (row.embedding && Buffer.isBuffer(row.embedding)) {
        const floatArray = new Float32Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.length / 4);
        embedding = Array.from(floatArray);
      }
      return { item: row, embedding };
    });

    const topK = EmbeddingEngine.findTopK(queryEmbedding, candidates, limit);
    return topK.map(r => r.item);
  }

  static getAuditReport() {
    const total = memoryVault.prepare(`SELECT COUNT(*) as count FROM experimental_data_log`).get() as {count: number};
    const byCategory = memoryVault.prepare(`SELECT category, COUNT(*) as count FROM experimental_data_log GROUP BY category`).all();
    const byRisk = memoryVault.prepare(`SELECT risk_level, COUNT(*) as count FROM experimental_data_log GROUP BY risk_level`).all();

    return {
      status: 'ONLINE',
      vectorEngine: 'Operational',
      storage: 'Memory Vault (SQLite) + RAG Emulation',
      totalExperimentsLogged: total.count,
      breakdownByCategory: byCategory,
      breakdownByRisk: byRisk,
      upgradePaths: [
        'Migrate from local SQLite BLOB embeddings to external Chroma/Pinecone cluster for millions of vectors.',
        'Implement real-time model fine-tuning loops triggered automatically after N new lessons learned.',
        'Deploy dedicated edge-RAG microservice for lower latency feedback matching.'
      ]
    };
  }
}
