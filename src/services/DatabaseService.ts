import fs from 'fs';
import path from 'path';

export interface SlangMapping {
    id?: number;
    term: string;
    target_primitive: string;
    drift_score: number;
    status: string;
    context_scraped: string;
    timestamp: string;
}

export interface ExecutionLog {
    id?: number;
    timestamp: string;
    log_level: string;
    module: string;
    message: string;
    stack_trace?: string;
}

export interface SystemMetric {
    id?: number;
    timestamp: string;
    cpu_load: number;
    memory_usage: number;
    active_jobs: number;
    active_concurrency: number;
}

export class DatabaseService {
    private db: any = null;
    private fallbackDbPath: string;
    private dbPath: string;
    private useFallback = false;

    constructor() {
        const dataDir = path.join(process.cwd(), 'src/data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        this.dbPath = path.join(process.cwd(), 'codedummy.db');
        this.fallbackDbPath = path.join(process.cwd(), 'src/data/fallback_db.json');
        this.initialize();
    }

    private initialize() {
        try {
            // Attempt to load better-sqlite3 dynamically
            // Node.js native packages can throw errors on standard environments
            const Database = require('better-sqlite3');
            this.db = new Database(this.dbPath);
            console.log(`📂 [DatabaseService] SQLite Database loaded at: ${this.dbPath}`);

            // Create tables
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS slang_mappings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    term TEXT,
                    target_primitive TEXT UNIQUE,
                    drift_score REAL,
                    status TEXT,
                    context_scraped TEXT,
                    timestamp TEXT
                );
                
                CREATE TABLE IF NOT EXISTS execution_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT,
                    log_level TEXT,
                    module TEXT,
                    message TEXT,
                    stack_trace TEXT
                );
                
                CREATE TABLE IF NOT EXISTS system_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT,
                    cpu_load REAL,
                    memory_usage REAL,
                    active_jobs INTEGER,
                    active_concurrency INTEGER
                );
            `);
            this.useFallback = false;
        } catch (err: any) {
            this.useFallback = true;
            console.warn(`⚠️ [DatabaseService] SQLite load failed (${err.message}). Activating JSON fail-safe engine.`);
            this.ensureFallbackFile();
        }
    }

    private ensureFallbackFile() {
        if (!fs.existsSync(this.fallbackDbPath)) {
            const initialData = {
                slang_mappings: [],
                execution_logs: [],
                system_metrics: []
            };
            fs.writeFileSync(this.fallbackDbPath, JSON.stringify(initialData, null, 2), 'utf8');
        }
    }

    private readFallback(): any {
        this.ensureFallbackFile();
        try {
            const raw = fs.readFileSync(this.fallbackDbPath, 'utf8');
            return JSON.parse(raw);
        } catch (e) {
            return { slang_mappings: [], execution_logs: [], system_metrics: [] };
        }
    }

    private writeFallback(data: any) {
        try {
            fs.writeFileSync(this.fallbackDbPath, JSON.stringify(data, null, 2), 'utf8');
        } catch (err) {
            console.error(`❌ [DatabaseService] Failed to write JSON fallback:`, err);
        }
    }

    // --- SLANG MAPPINGS ---
    public insertSlang(mapping: SlangMapping): boolean {
        if (!this.useFallback && this.db) {
            try {
                const stmt = this.db.prepare(`
                    INSERT INTO slang_mappings (term, target_primitive, drift_score, status, context_scraped, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT(target_primitive) DO UPDATE SET
                        term=excluded.term,
                        drift_score=excluded.drift_score,
                        status=excluded.status,
                        context_scraped=excluded.context_scraped,
                        timestamp=excluded.timestamp
                `);
                stmt.run(
                    mapping.term,
                    mapping.target_primitive,
                    mapping.drift_score,
                    mapping.status,
                    mapping.context_scraped,
                    mapping.timestamp || new Date().toISOString()
                );
                return true;
            } catch (err: any) {
                console.error(`❌ [DatabaseService] SQLite slang insert failed: ${err.message}`);
                return false;
            }
        } else {
            const data = this.readFallback();
            const existingIndex = data.slang_mappings.findIndex((m: any) => m.target_primitive === mapping.target_primitive);
            const entry = {
                id: existingIndex >= 0 ? data.slang_mappings[existingIndex].id : Date.now(),
                ...mapping,
                timestamp: mapping.timestamp || new Date().toISOString()
            };
            if (existingIndex >= 0) {
                data.slang_mappings[existingIndex] = entry;
            } else {
                data.slang_mappings.push(entry);
            }
            this.writeFallback(data);
            return true;
        }
    }

    public getAllSlangs(): SlangMapping[] {
        if (!this.useFallback && this.db) {
            try {
                return this.db.prepare(`SELECT * FROM slang_mappings ORDER BY timestamp DESC`).all();
            } catch (err) {
                return [];
            }
        } else {
            const data = this.readFallback();
            return data.slang_mappings.sort((a: any, b: any) => b.id - a.id);
        }
    }

    // --- EXECUTION LOGS ---
    public insertLog(log: ExecutionLog): boolean {
        if (!this.useFallback && this.db) {
            try {
                const stmt = this.db.prepare(`
                    INSERT INTO execution_logs (timestamp, log_level, module, message, stack_trace)
                    VALUES (?, ?, ?, ?, ?)
                `);
                stmt.run(
                    log.timestamp || new Date().toISOString(),
                    log.log_level,
                    log.module,
                    log.message,
                    log.stack_trace || ''
                );
                return true;
            } catch (err: any) {
                console.error(`❌ [DatabaseService] SQLite log insert failed: ${err.message}`);
                return false;
            }
        } else {
            const data = this.readFallback();
            const entry = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                ...log,
                timestamp: log.timestamp || new Date().toISOString()
            };
            data.execution_logs.unshift(entry);
            // Cap at 100 entries to prevent files from inflating
            if (data.execution_logs.length > 100) {
                data.execution_logs = data.execution_logs.slice(0, 100);
            }
            this.writeFallback(data);
            return true;
        }
    }

    public getLogs(limit = 50): ExecutionLog[] {
        if (!this.useFallback && this.db) {
            try {
                return this.db.prepare(`SELECT * FROM execution_logs ORDER BY id DESC LIMIT ?`).all(limit);
            } catch (err) {
                return [];
            }
        } else {
            const data = this.readFallback();
            return data.execution_logs.slice(0, limit);
        }
    }

    // --- SYSTEM METRICS ---
    public insertSystemMetrics(metric: SystemMetric): boolean {
        if (!this.useFallback && this.db) {
            try {
                const stmt = this.db.prepare(`
                    INSERT INTO system_metrics (timestamp, cpu_load, memory_usage, active_jobs, active_concurrency)
                    VALUES (?, ?, ?, ?, ?)
                `);
                stmt.run(
                    metric.timestamp || new Date().toISOString(),
                    metric.cpu_load,
                    metric.memory_usage,
                    metric.active_jobs,
                    metric.active_concurrency
                );
                return true;
            } catch (err: any) {
                console.error(`❌ [DatabaseService] SQLite metrics insert failed: ${err.message}`);
                return false;
            }
        } else {
            const data = this.readFallback();
            const entry = {
                id: Date.now(),
                ...metric,
                timestamp: metric.timestamp || new Date().toISOString()
            };
            data.system_metrics.push(entry);
            // Keep latest 100 metrics
            if (data.system_metrics.length > 100) {
                data.system_metrics = data.system_metrics.slice(data.system_metrics.length - 100);
            }
            this.writeFallback(data);
            return true;
        }
    }

    public getLatestMetrics(): SystemMetric | null {
        if (!this.useFallback && this.db) {
            try {
                return this.db.prepare(`SELECT * FROM system_metrics ORDER BY id DESC LIMIT 1`).get() || null;
            } catch (err) {
                return null;
            }
        } else {
            const data = this.readFallback();
            if (data.system_metrics.length === 0) return null;
            return data.system_metrics[data.system_metrics.length - 1];
        }
    }

    public getMetricHistory(limit = 30): SystemMetric[] {
        if (!this.useFallback && this.db) {
            try {
                return this.db.prepare(`SELECT * FROM system_metrics ORDER BY id DESC LIMIT ?`).all(limit).reverse();
            } catch (err) {
                return [];
            }
        } else {
            const data = this.readFallback();
            return data.system_metrics.slice(-limit);
        }
    }
}

export const databaseService = new DatabaseService();
