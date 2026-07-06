import { memoryVault } from './db';
import { nexusBus } from './modelRouter';
import fs from 'fs';
import path from 'path';

export interface CollectionReport {
  pairsCollected: {
    swarm: number;
    overnight: number;
    mind: number;
    dna: number;
  };
  totalPairs: number;
  outputPath: string;
  timestamp: string;
}

export class FineTuneCollector {
  private static trainingDataDir = path.join(process.cwd(), 'training_data');

  public static initDatabase() {
    try {
      memoryVault.exec(`
        CREATE TABLE IF NOT EXISTS fine_tune_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          total_pairs INTEGER NOT NULL,
          swarm_count INTEGER NOT NULL,
          overnight_count INTEGER NOT NULL,
          mind_count INTEGER NOT NULL,
          dna_count INTEGER NOT NULL,
          output_path TEXT,
          status TEXT NOT NULL
        );
      `);
    } catch (err: any) {
      console.warn('[FineTuneCollector] Database init warning:', err.message);
    }
  }

  public static async collect(): Promise<CollectionReport> {
    this.initDatabase();

    try {
      if (!fs.existsSync(this.trainingDataDir)) {
        fs.mkdirSync(this.trainingDataDir, { recursive: true });
      }

      const swarmPairs: any[] = [];
      const overnightPairs: any[] = [];
      const mindPairs: any[] = [];
      const dnaPairs: any[] = [];

      // 1. Collect from swarm_jobs (confidence > 0.85)
      try {
        const swarmJobs = memoryVault.prepare(`
          SELECT task, result, created_at, confidence, model_used, task_type 
          FROM swarm_jobs 
          WHERE confidence > 0.85 AND status = 'COMPLETED'
        `).all() as any[];

        for (const job of swarmJobs) {
          swarmPairs.push({
            prompt: job.task,
            completion: job.result || '',
            source: 'swarm_jobs',
            model_used: job.model_used || 'unknown',
            confidence: job.confidence,
            timestamp: job.created_at || new Date().toISOString(),
            task_type: job.task_type || 'SWARM_WORKER'
          });
        }
      } catch (err: any) {
        console.warn('[FineTuneCollector] Swarm jobs fetch failed safely:', err.message);
      }

      // 2. Collect from overnight_log (status = COMPLETE and pending_review = false)
      try {
        const overnightLogs = memoryVault.prepare(`
          SELECT task, result, completed_at, confidence, model_used, task_type
          FROM overnight_log 
          WHERE status = 'COMPLETE' AND pending_review = 0
        `).all() as any[];

        for (const log of overnightLogs) {
          overnightPairs.push({
            prompt: log.task,
            completion: log.result || '',
            source: 'overnight_log',
            model_used: log.model_used || 'unknown',
            confidence: log.confidence || 0.9,
            timestamp: log.completed_at || new Date().toISOString(),
            task_type: log.task_type || 'OVERNIGHT_TASK'
          });
        }
      } catch (err: any) {
        console.warn('[FineTuneCollector] Overnight log fetch failed safely:', err.message);
      }

      // 3. Collect from mind_log where adjudicator_result = APPROVED
      try {
        const mindLogs = memoryVault.prepare(`
          SELECT directive_intent, reasoning, timestamp, adjudicator_result, model_used, task_type
          FROM mind_log 
          WHERE adjudicator_result = 'APPROVED'
        `).all() as any[];

        for (const log of mindLogs) {
          mindPairs.push({
            prompt: log.directive_intent || 'Explain active reasoning',
            completion: log.reasoning || '',
            source: 'mind_log',
            model_used: log.model_used || 'unknown',
            confidence: 0.95,
            timestamp: log.timestamp || new Date().toISOString(),
            task_type: log.task_type || 'DEEP_REASONING'
          });
        }
      } catch (err: any) {
        console.warn('[FineTuneCollector] Mind log fetch failed safely:', err.message);
      }

      // 4. Collect from dna_archive where rank = 'MASTER'
      try {
        const dnaTableExist = memoryVault.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='dna_archive'").get() as { count: number };
        if (dnaTableExist.count > 0) {
          const dnaRecords = memoryVault.prepare(`
            SELECT dna_config, run_status, timestamp 
            FROM dna_archive 
            WHERE run_status = 'MASTER' OR promoted = 1
          `).all() as any[];

          for (const dna of dnaRecords) {
            dnaPairs.push({
              prompt: 'Generate optimal physics DNA parameters',
              completion: typeof dna.dna_config === 'string' ? dna.dna_config : JSON.stringify(dna.dna_config),
              source: 'dna_archive',
              model_used: 'evolution_engine',
              confidence: 0.99,
              timestamp: dna.timestamp || new Date().toISOString(),
              task_type: 'DNA_OPTIMIZATION'
            });
          }
        }
      } catch (err: any) {
        console.warn('[FineTuneCollector] DNA archive fetch failed safely:', err.message);
      }

      // Write files
      const writeJSONL = (filePath: string, pairs: any[]) => {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const content = pairs.map(p => JSON.stringify(p)).join('\n');
        fs.writeFileSync(filePath, content, 'utf8');
      };

      writeJSONL(path.join(this.trainingDataDir, 'swarm_pairs.jsonl'), swarmPairs);
      writeJSONL(path.join(this.trainingDataDir, 'overnight_pairs.jsonl'), overnightPairs);
      writeJSONL(path.join(this.trainingDataDir, 'mind_pairs.jsonl'), mindPairs);
      writeJSONL(path.join(this.trainingDataDir, 'dna_pairs.jsonl'), dnaPairs);

      const total = swarmPairs.length + overnightPairs.length + mindPairs.length + dnaPairs.length;
      const outputPath = this.trainingDataDir;

      // Log success to DB
      try {
        memoryVault.prepare(`
          INSERT INTO fine_tune_log (total_pairs, swarm_count, overnight_count, mind_count, dna_count, output_path, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(total, swarmPairs.length, overnightPairs.length, mindPairs.length, dnaPairs.length, outputPath, 'SUCCESS');
      } catch (err: any) {
        console.warn('[FineTuneCollector] Warning writing to fine_tune_log:', err.message);
      }

      // Emit update on bus
      nexusBus.emit('TRAINING_DATA_UPDATED', { total, swarm: swarmPairs.length, overnight: overnightPairs.length, mind: mindPairs.length, dna: dnaPairs.length });

      return {
        pairsCollected: {
          swarm: swarmPairs.length,
          overnight: overnightPairs.length,
          mind: mindPairs.length,
          dna: dnaPairs.length
        },
        totalPairs: total,
        outputPath,
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      console.error('[FineTuneCollector] Execution failed:', err);
      // Log failure to DB
      try {
        memoryVault.prepare(`
          INSERT INTO fine_tune_log (total_pairs, swarm_count, overnight_count, mind_count, dna_count, output_path, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(0, 0, 0, 0, 0, this.trainingDataDir, 'FAILED: ' + err.message);
      } catch (logErr) {}
      throw err;
    }
  }

  public static getFileCounts() {
    const counts = { swarm: 0, overnight: 0, mind: 0, dna: 0, total: 0 };
    try {
      const filesMap = {
        swarm: 'swarm_pairs.jsonl',
        overnight: 'overnight_pairs.jsonl',
        mind: 'mind_pairs.jsonl',
        dna: 'dna_pairs.jsonl'
      };
      for (const [key, filename] of Object.entries(filesMap)) {
        const filePath = path.join(this.trainingDataDir, filename);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n').filter(line => line.trim().length > 0);
          counts[key as keyof typeof counts] = lines.length;
        }
      }
      counts.total = counts.swarm + counts.overnight + counts.mind + counts.dna;
    } catch (err) {
      console.warn('[FineTuneCollector] counting failed:', err);
    }
    return counts;
  }

  public static scheduleCollection(): void {
    // Run collection every 24 hours
    setInterval(async () => {
      try {
        console.log('[FineTuneCollector] Auto daily collection loop triggered...');
        await this.collect();
      } catch (err: any) {
        console.error('[FineTuneCollector] Auto schedule task failure:', err.message);
      }
    }, 24 * 60 * 60 * 1000);
  }
}
