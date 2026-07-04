import { memoryVault } from './db';
import path from 'path';

export function runImmortalityMigrations() {
  console.log('[dbMigrations] Initiating Immortality Schema Sync...');
  
  // Tables definition
  const tables = [
    `CREATE TABLE IF NOT EXISTS model_router_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      provider_selected TEXT,
      was_fallback BOOLEAN,
      task_type TEXT,
      latency_ms INTEGER,
      tokens_in INTEGER,
      tokens_out INTEGER,
      estimated_cost REAL,
      status TEXT,
      error_message TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS resurrection_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      op_type TEXT,
      op_id TEXT,
      status TEXT,
      payload TEXT,
      resolution TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS session_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      memory_vault_state TEXT,
      mind_state TEXT,
      roadmap_position TEXT,
      recent_swarm_results TEXT,
      recent_mind_logs TEXT,
      master_dna_config TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS quantum_files (
      id TEXT PRIMARY KEY,
      filename TEXT,
      content TEXT,
      version_number INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      token_count INTEGER,
      checksum TEXT,
      parent_version_id TEXT,
      change_summary TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS quantum_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id TEXT,
      chunk_index INTEGER,
      chunk_type TEXT,
      content TEXT,
      start_line INTEGER,
      end_line INTEGER,
      token_count INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS quantum_conversations (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      file_id TEXT,
      messages TEXT,
      total_tokens_used INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS mind_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      directive_intent TEXT,
      reasoning TEXT,
      status TEXT,
      full_context_snapshot TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      adjudicator_result TEXT,
      model_used TEXT,
      task_type TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS spine_event_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT,
      payload TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS embeddings (
      id TEXT PRIMARY KEY,
      table_name TEXT,
      row_id TEXT,
      embedding TEXT,
      text_content TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS patterns (
      id TEXT PRIMARY KEY,
      pattern_type TEXT,
      description TEXT,
      confidence_score REAL,
      evidence_count INTEGER,
      first_seen TEXT,
      last_seen TEXT,
      actionable_recommendation TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS prompt_queue (
      id TEXT PRIMARY KEY,
      queue_id TEXT,
      position INTEGER,
      prompt_text TEXT,
      status TEXT,
      result TEXT,
      error TEXT,
      started_at TEXT,
      completed_at TEXT,
      prerequisite_position INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS file_structure_cache (
      checksum TEXT PRIMARY KEY,
      structure_map TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS semantic_index (
      id TEXT PRIMARY KEY,
      source_table TEXT NOT NULL,
      source_id TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      text_content TEXT,
      embedding BLOB NOT NULL,
      indexed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      token_count INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS overnight_log (
      id TEXT PRIMARY KEY,
      started_at TEXT,
      completed_at TEXT,
      task TEXT,
      result TEXT,
      improvements_made TEXT,
      files_modified TEXT,
      pending_review INTEGER DEFAULT 1,
      session_id TEXT,
      model_used TEXT,
      confidence REAL,
      task_type TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS world_state (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      confidence REAL DEFAULT 1.0,
      last_verified TEXT DEFAULT CURRENT_TIMESTAMP,
      source TEXT,
      expires_at TEXT,
      stale INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS pattern_log (
      id TEXT PRIMARY KEY,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      patterns_json TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS swarm_jobs (
      id TEXT,
      jobId TEXT PRIMARY KEY,
      task TEXT NOT NULL,
      worker_count INTEGER,
      workerCount INTEGER,
      strategy TEXT,
      merge_strategy TEXT,
      mergeStrategy TEXT,
      status TEXT,
      result TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      completedAt DATETIME,
      confidence REAL,
      model_used TEXT,
      task_type TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS kinetic_logs (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      stage_transition TEXT,
      bass_sensitivity REAL,
      turbulence REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS api_cost_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      tokens_in INTEGER,
      tokens_out INTEGER,
      cost_usd REAL,
      task_type TEXT,
      task_id TEXT,
      reason TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS fine_tune_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_pairs INTEGER NOT NULL,
      swarm_count INTEGER NOT NULL,
      overnight_count INTEGER NOT NULL,
      mind_count INTEGER NOT NULL,
      dna_count INTEGER NOT NULL,
      output_path TEXT,
      status TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS dna_archive (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_json TEXT NOT NULL,
      run_status TEXT NOT NULL,
      frame_time_avg REAL,
      jitter_peak INTEGER,
      promoted BOOLEAN DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      dna_config TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS file_matrix (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT,
      code_chunk TEXT,
      embedding BLOB
    )`,
    `CREATE TABLE IF NOT EXISTS autonomous_tasks (
      id TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      status TEXT NOT NULL,
      result TEXT,
      logs TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS game_index (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT,
      symbol_type TEXT,
      name TEXT,
      line_start INTEGER,
      line_end INTEGER,
      code TEXT,
      description TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS bug_tracker (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      location TEXT,
      status TEXT DEFAULT 'OPEN',
      fixed_in_commit TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS session_memory_summaries (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      summary_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS file_change_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT,
      diff_content TEXT,
      model_used TEXT,
      status TEXT DEFAULT 'APPLIED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS prompt_library (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      task_type TEXT,
      use_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS gpu_instances (
      id TEXT PRIMARY KEY,
      provider TEXT,
      gpu TEXT,
      cost_per_hr TEXT,
      status TEXT DEFAULT 'OFFLINE',
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS kinetic_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_name TEXT,
      asset_value REAL,
      cash_flow REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS debt_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creditor TEXT,
      total_amount REAL,
      remaining_amount REAL,
      interest_rate REAL,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS swarm_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT,
      builder_output TEXT,
      destroyer_critique TEXT,
      optimizer_synthesis TEXT,
      adjudicator_ruling TEXT,
      status TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS memory_user_edits (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  tables.forEach((sql) => {
    try {
      memoryVault.prepare(sql).run();
    } catch (err: any) {
      console.error('[dbMigrations] Failed to execute:', sql, err.message);
    }
  });

  // Hotfix: Add missing columns to existing tables
  try { memoryVault.prepare(`ALTER TABLE swarm_jobs ADD COLUMN id TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE swarm_jobs ADD COLUMN jobId TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE swarm_jobs ADD COLUMN task TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE swarm_jobs ADD COLUMN workerCount INTEGER`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE swarm_jobs ADD COLUMN worker_count INTEGER`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE swarm_jobs ADD COLUMN strategy TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE swarm_jobs ADD COLUMN mergeStrategy TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE swarm_jobs ADD COLUMN merge_strategy TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE swarm_jobs ADD COLUMN status TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE swarm_jobs ADD COLUMN result TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE swarm_jobs ADD COLUMN createdAt DATETIME`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE swarm_jobs ADD COLUMN created_at TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE swarm_jobs ADD COLUMN completed_at TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE swarm_jobs ADD COLUMN completedAt DATETIME`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE swarm_jobs ADD COLUMN model_used TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE swarm_jobs ADD COLUMN confidence REAL`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE swarm_jobs ADD COLUMN task_type TEXT`).run(); } catch(e) {}

  try { memoryVault.prepare(`ALTER TABLE prompt_queue ADD COLUMN id TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE prompt_queue ADD COLUMN queue_id TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE prompt_queue ADD COLUMN position INTEGER`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE prompt_queue ADD COLUMN prompt_text TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE prompt_queue ADD COLUMN status TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE prompt_queue ADD COLUMN result TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE prompt_queue ADD COLUMN error TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE prompt_queue ADD COLUMN started_at TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE prompt_queue ADD COLUMN completed_at TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE prompt_queue ADD COLUMN prerequisite_position INTEGER`).run(); } catch(e) {}

  try { memoryVault.prepare(`ALTER TABLE swarm_results ADD COLUMN task_id TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE swarm_results ADD COLUMN builder_output TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE swarm_results ADD COLUMN destroyer_critique TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE swarm_results ADD COLUMN optimizer_synthesis TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE swarm_results ADD COLUMN adjudicator_ruling TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE swarm_results ADD COLUMN status TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE swarm_results ADD COLUMN timestamp DATETIME`).run(); } catch(e) {}

  try { memoryVault.prepare(`ALTER TABLE overnight_log ADD COLUMN model_used TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE overnight_log ADD COLUMN confidence REAL`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE overnight_log ADD COLUMN task_type TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE overnight_log ADD COLUMN status TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE overnight_log ADD COLUMN pending_review INTEGER DEFAULT 1`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE mind_log ADD COLUMN adjudicator_result TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE mind_log ADD COLUMN model_used TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE mind_log ADD COLUMN task_type TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE mind_log ADD COLUMN project_id TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE dna_archive ADD COLUMN dna_config TEXT`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE autonomous_tasks ADD COLUMN started_at DATETIME`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE autonomous_tasks ADD COLUMN completed_at DATETIME`).run(); } catch(e) {}
  try { memoryVault.prepare(`ALTER TABLE autonomous_tasks ADD COLUMN retry_count INTEGER DEFAULT 0`).run(); } catch(e) {}

  console.log('[dbMigrations] Immortality Schema Sync finished.');
}
