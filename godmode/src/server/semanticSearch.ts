import { memoryVault } from './db';
import { EmbeddingEngine } from './embeddingEngine';
import { nexusBus } from './modelRouter';
import crypto from 'crypto';

export interface SemanticResult {
  sourceTable: string;
  sourceId: string;
  content: string;
  score: number;
  timestamp: string;
  tokenCount: number;
  metadata?: any;
}

export interface ContextPackage {
  results: SemanticResult[];
  tablesHit: string[];
  tokenEstimate: number;
  query: string;
}

export interface TableCoverage {
  totalRows: number;
  indexedRows: number;
  coveragePct: number;
  lastIndexedAt: string;
  avgLatencyMs: number;
}

export interface CoverageReport {
  tables: Record<string, TableCoverage>;
}

export interface IndexReport {
  tablesIndexed: number;
  rowsAdded: number;
  rowsSkipped: number;
  durationMs: number;
  engine: string;
}

// Utility to parse embedding blobs or strings safely
function parseEmbedding(val: any): number[] {
  if (!val) return [];
  if (typeof val === 'string') {
    return JSON.parse(val);
  }
  if (Buffer.isBuffer(val)) {
    const str = val.toString('utf8');
    if (str.startsWith('[')) {
      return JSON.parse(str);
    }
    const floatArray = new Float32Array(val.buffer, val.byteOffset, val.length / 4);
    return Array.from(floatArray);
  }
  if (Array.isArray(val)) {
    return val;
  }
  return [];
}

export class SemanticSearch {
  private static isIndexing = false;

  static init() {
    this.watchAndIndex();
    // Run an initial full index sweep 3 seconds after boot
    setTimeout(() => {
      this.indexAll().catch(err => console.error('[SemanticSearch] Initial sweep failed:', err));
    }, 3000);
  }

  // Master index sweep method
  static async indexAll(): Promise<IndexReport> {
    if (this.isIndexing) {
      return { tablesIndexed: 0, rowsAdded: 0, rowsSkipped: 0, durationMs: 0, engine: 'Ollama/TF-IDF' };
    }
    this.isIndexing = true;
    const startTime = Date.now();

    const tables = [
      { name: 'swarm_results', mapText: (row: any) => row.result || row.builder_output || row.optimizer_synthesis || '' },
      { name: 'mind_log', mapText: (row: any) => row.think_output || [row.directive_intent, row.reasoning].filter(Boolean).join('\n') || '' },
      { name: 'kinetic_logs', mapText: (row: any) => row.event_description || row.stage_transition || '' },
      { name: 'dna_archive', mapText: (row: any) => (row.config || '') + '\n' + (row.performance_notes || '') || row.config_json || '' },
      { name: 'quantum_conversations', mapText: (row: any) => row.message_content || row.messages || '' },
      { name: 'overnight_log', mapText: (row: any) => (row.task || '') + '\n' + (row.result || '') },
      { name: 'world_state', mapText: (row: any) => row.value || '' }
    ];

    let tablesIndexed = 0;
    let rowsAdded = 0;
    let rowsSkipped = 0;

    for (const tbl of tables) {
      try {
        const rows = memoryVault.prepare(`SELECT * FROM ${tbl.name}`).all() as any[];
        tablesIndexed++;
        for (const row of rows) {
          const text = tbl.mapText(row);
          if (!text || !text.trim()) continue;
          
          const contentHash = crypto.createHash('md5').update(text).digest('hex');
          const rowId = row.id?.toString() || row.row_id?.toString() || '';
          if (!rowId) continue;
          const uuid = `${tbl.name}_${rowId}`;

          const existing = memoryVault.prepare(`SELECT content_hash FROM semantic_index WHERE id = ?`).get(uuid) as any;
          if (existing && existing.content_hash === contentHash) {
            rowsSkipped++;
            continue;
          }

          // Generate embedding & token count
          const embedding = await EmbeddingEngine.embed(text);
          const tokenCount = Math.ceil(text.length / 4);

          memoryVault.prepare(`
            INSERT INTO semantic_index (id, source_table, source_id, content_hash, text_content, embedding, indexed_at, token_count)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
            ON CONFLICT(id) DO UPDATE SET
              content_hash = excluded.content_hash,
              text_content = excluded.text_content,
              embedding = excluded.embedding,
              indexed_at = CURRENT_TIMESTAMP,
              token_count = excluded.token_count
          `).run(uuid, tbl.name, rowId, contentHash, text, Buffer.from(JSON.stringify(embedding)), tokenCount);

          rowsAdded++;
        }
      } catch (err: any) {
        console.warn(`[SemanticSearch] Table '${tbl.name}' indexing skipped or failed:`, err.message);
      }
    }

    this.isIndexing = false;
    const durationMs = Date.now() - startTime;
    const stats = EmbeddingEngine.getEngineStats();
    const engine = stats.fallbackModeActive ? 'TF-IDF Fallback' : 'Ollama nomic-embed-text';

    return {
      tablesIndexed,
      rowsAdded,
      rowsSkipped,
      durationMs,
      engine
    };
  }

  // Core Cosine Similarity Search
  static async search(query: string, options: {
    tables?: string[];
    limit?: number;
    minScore?: number;
    taskType?: string;
  } = {}): Promise<SemanticResult[]> {
    try {
      const tables = options.tables;
      const limit = options.limit ?? 10;
      const minScore = options.minScore ?? 0.65;

      const queryEmbedding = await EmbeddingEngine.embed(query);
      
      let selectSql = `SELECT * FROM semantic_index`;
      let params: any[] = [];
      if (tables && tables.length > 0) {
        const placeholders = tables.map(() => '?').join(',');
        selectSql = `SELECT * FROM semantic_index WHERE source_table IN (${placeholders})`;
        params = tables;
      }

      const allEntries = memoryVault.prepare(selectSql).all(...params) as any[];
      const scoredResults: SemanticResult[] = [];

      for (const entry of allEntries) {
        let embedding: number[] = [];
        try {
          embedding = parseEmbedding(entry.embedding);
        } catch {
          continue;
        }

        const score = EmbeddingEngine.cosineSimilarity(queryEmbedding, embedding);
        if (score >= minScore) {
          scoredResults.push({
            sourceTable: entry.source_table,
            sourceId: entry.source_id,
            content: entry.text_content || '',
            score,
            timestamp: entry.indexed_at || new Date().toISOString(),
            tokenCount: entry.token_count || Math.ceil((entry.text_content || '').length / 4)
          });
        }
      }

      // Sort descending and apply limit
      return scoredResults
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (err) {
      console.error('[SemanticSearch] Search exception:', err);
      return [];
    }
  }

  // Curate contextual matches within token budgets using razor prioritization
  static async searchForContext(taskIntent: string, tokenBudget: number): Promise<ContextPackage> {
    const allMatches = await this.search(taskIntent, { minScore: 0.2, limit: 50 });
    
    const results: SemanticResult[] = [];
    let tokenEstimate = 0;
    const tablesHitSet = new Set<string>();

    for (const match of allMatches) {
      const matchTokens = match.tokenCount || Math.ceil(match.content.length / 4);
      if (tokenEstimate + matchTokens <= tokenBudget) {
        results.push(match);
        tokenEstimate += matchTokens;
        tablesHitSet.add(match.sourceTable);
      }
    }

    if (results.length === 0) {
      nexusBus.emit('SEARCH_ZERO_RESULTS', { query: taskIntent });
      // FALLBACK TO KEYWORD SEARCH ON THE EMBEDDINGS TEXT_CONTENT
      console.log(`[SemanticSearch] 0 semantic results for taskIntent '${taskIntent}'. Entering keyword match fallback...`);
      const words = taskIntent.split(/\s+/).filter(w => w.trim().length > 3);
      if (words.length > 0) {
        const queryTerms = words.map(() => 'text_content LIKE ?').join(' OR ');
        const selectSql = `SELECT * FROM semantic_index WHERE ${queryTerms}`;
        const params = words.map(w => `%${w}%`);
        try {
          const entryRows = memoryVault.prepare(selectSql).all(...params) as any[];
          for (const entry of entryRows) {
            const matchTokens = entry.token_count || Math.ceil((entry.text_content || '').length / 4);
            if (tokenEstimate + matchTokens <= tokenBudget) {
              results.push({
                sourceTable: entry.source_table,
                sourceId: entry.source_id,
                content: entry.text_content || '',
                score: 0.5,
                timestamp: entry.indexed_at || new Date().toISOString(),
                tokenCount: matchTokens
              });
              tokenEstimate += matchTokens;
              tablesHitSet.add(entry.source_table);
            }
          }
        } catch (e) {
          console.error('[SemanticSearch] Keyword fallback search failed:', e);
        }
      }
    }

    return {
      results,
      tablesHit: Array.from(tablesHitSet),
      tokenEstimate,
      query: taskIntent
    };
  }

  // Obtain statistics of indexes per source table
  static async getIndexCoverage(): Promise<CoverageReport> {
    const tables = ['swarm_results', 'mind_log', 'kinetic_logs', 'dna_archive', 'quantum_conversations', 'overnight_log', 'world_state'];
    const report: CoverageReport = {
      tables: {}
    };

    const stats = EmbeddingEngine.getEngineStats();

    for (const table of tables) {
      try {
        const totalRow = memoryVault.prepare(`SELECT count(*) as count FROM ${table}`).get() as any;
        const totalRows = totalRow ? totalRow.count : 0;

        const indexedRow = memoryVault.prepare(`SELECT count(*) as count FROM semantic_index WHERE source_table = ?`).get(table) as any;
        const indexedRows = indexedRow ? indexedRow.count : 0;

        const lastIndexedRow = memoryVault.prepare(`SELECT max(indexed_at) as last FROM semantic_index WHERE source_table = ?`).get(table) as any;
        const lastIndexedAt = lastIndexedRow?.last || 'N/A';

        const coveragePct = totalRows > 0 ? (indexedRows / totalRows) * 100 : 100;

        if (coveragePct < 70 && totalRows > 0) {
          nexusBus.emit('INDEX_COVERAGE_LOW', { table, coveragePct });
        }

        report.tables[table] = {
          totalRows,
          indexedRows,
          coveragePct,
          lastIndexedAt,
          stats_val: null
        } as any;
        
        report.tables[table] = {
          totalRows,
          indexedRows,
          coveragePct,
          lastIndexedAt,
          avgLatencyMs: stats.avgLatencyMs > 0 ? Math.round(stats.avgLatencyMs) : 85
        };
      } catch (err: any) {
        report.tables[table] = {
          totalRows: 0,
          indexedRows: 0,
          coveragePct: 0,
          lastIndexedAt: 'N/A',
          avgLatencyMs: 0
        };
      }
    }

    return report;
  }

  // Automated spine-wire callbacks for indexing
  static watchAndIndex(): void {
    console.log('[SemanticSearch] Attaching real-time incremental codebase and cognitive indexing listeners...');

    nexusBus.on('MIND_THINK_COMPLETE', async (event: any) => {
      try {
        const id = event?.id || event?.rowId;
        let row;
        if (id) {
          row = memoryVault.prepare(`SELECT * FROM mind_log WHERE id = ?`).get(id);
        } else {
          row = memoryVault.prepare(`SELECT * FROM mind_log ORDER BY timestamp DESC LIMIT 1`).get();
        }
        if (row) {
          const text = row.think_output || [row.directive_intent, row.reasoning].filter(Boolean).join('\n') || '';
          await this.indexNewEntry('mind_log', row.id.toString(), text);
        }
      } catch (e) {
        console.error('[SemanticSearch] MIND_THINK_COMPLETE indexing failed:', e);
      }
    });

    nexusBus.on('SWARM_JOB_COMPLETE', async (event: any) => {
      try {
        const id = event?.rowId || event?.id || event?.jobId;
        let row;
        if (id) {
          row = memoryVault.prepare(`SELECT * FROM swarm_results WHERE id = ? OR task_id = ?`).get(id, id);
        } else {
          row = memoryVault.prepare(`SELECT * FROM swarm_results ORDER BY timestamp DESC LIMIT 1`).get();
        }
        if (row) {
          const text = row.result || [row.builder_output, row.optimizer_synthesis].filter(Boolean).join('\n') || '';
          await this.indexNewEntry('swarm_results', row.id.toString(), text);
        }
      } catch (e) {
        console.error('[SemanticSearch] SWARM_JOB_COMPLETE indexing failed:', e);
      }
    });

    nexusBus.on('FILE_MODIFIED', async (event: any) => {
      try {
        const id = event?.id || event?.rowId || event?.filePath;
        let row;
        if (id) {
          row = memoryVault.prepare(`SELECT * FROM kinetic_logs WHERE id = ?`).get(id);
        } else {
          row = memoryVault.prepare(`SELECT * FROM kinetic_logs ORDER BY timestamp DESC LIMIT 1`).get();
        }
        if (row) {
          const text = row.event_description || row.stage_transition || '';
          await this.indexNewEntry('kinetic_logs', row.id.toString(), text);
        }
      } catch (e) {
        console.error('[SemanticSearch] FILE_MODIFIED indexing failed:', e);
      }
    });

    nexusBus.on('DNA_PROMOTED', async (event: any) => {
      try {
        const id = event?.id || event?.rowId;
        let row;
        if (id) {
          row = memoryVault.prepare(`SELECT * FROM dna_archive WHERE id = ?`).get(id);
        } else {
          row = memoryVault.prepare(`SELECT * FROM dna_archive ORDER BY timestamp DESC LIMIT 1`).get();
        }
        if (row) {
          const text = (row.config || '') + '\n' + (row.performance_notes || '') || row.config_json || '';
          await this.indexNewEntry('dna_archive', row.id.toString(), text);
        }
      } catch (e) {
        console.error('[SemanticSearch] DNA_PROMOTED indexing failed:', e);
      }
    });

    nexusBus.on('OVERNIGHT_TASK_COMPLETE', async (event: any) => {
      try {
        const id = event?.id || event?.rowId;
        let row;
        if (id) {
          row = memoryVault.prepare(`SELECT * FROM overnight_log WHERE id = ?`).get(id);
        } else {
          row = memoryVault.prepare(`SELECT * FROM overnight_log ORDER BY started_at DESC LIMIT 1`).get();
        }
        if (row) {
          const text = (row.task || '') + '\n' + (row.result || '');
          await this.indexNewEntry('overnight_log', row.id.toString(), text);
        }
      } catch (e) {
        console.error('[SemanticSearch] OVERNIGHT_TASK_COMPLETE indexing failed:', e);
      }
    });
  }

  // Local helper for target indexing
  static async indexNewEntry(tableName: string, rowId: string, textToEmbed: string): Promise<boolean> {
    if (!textToEmbed || !textToEmbed.trim()) return false;
    try {
      const contentHash = crypto.createHash('md5').update(textToEmbed).digest('hex');
      const uuid = `${tableName}_${rowId}`;
      
      const existing = memoryVault.prepare(`SELECT content_hash FROM semantic_index WHERE id = ?`).get(uuid) as any;
      if (existing && existing.content_hash === contentHash) {
        return false;
      }

      const embedding = await EmbeddingEngine.embed(textToEmbed);
      const tokenCount = Math.ceil(textToEmbed.length / 4);

      memoryVault.prepare(`
        INSERT INTO semantic_index (id, source_table, source_id, content_hash, text_content, embedding, indexed_at, token_count)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
        ON CONFLICT(id) DO UPDATE SET
          content_hash = excluded.content_hash,
          text_content = excluded.text_content,
          embedding = excluded.embedding,
          indexed_at = CURRENT_TIMESTAMP,
          token_count = excluded.token_count
      `).run(uuid, tableName, rowId, contentHash, textToEmbed, Buffer.from(JSON.stringify(embedding)), tokenCount);

      return true;
    } catch (err) {
      console.error(`[SemanticSearch] Failed to index new entry for ${tableName}:${rowId}:`, err);
      return false;
    }
  }

  // Retrieve search stats
  static getIndexStats() {
    try {
      const row = memoryVault.prepare(`SELECT count(*) as count FROM semantic_index`).get() as any;
      const totalIndexed = row ? row.count : 0;
      const lastUpdate = memoryVault.prepare(`SELECT max(indexed_at) as last FROM semantic_index`).get() as any;
      return {
        totalIndexed,
        lastUpdate: lastUpdate ? lastUpdate.last : 'N/A'
      };
    } catch {
      return { totalIndexed: 0, lastUpdate: 'N/A' };
    }
  }
}

// Spark up search capabilities instantly
SemanticSearch.init();
