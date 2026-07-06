import { memoryVault } from './db';
import { runProjectMigrations } from '../database/projectMigrations';

// Ensure tables are migrated upon database boot-up
try {
  runProjectMigrations();
} catch (err: any) {
  console.error('[ProjectOrchestrator] Schema migration failure:', err.message);
}

export interface Project {
  id: string;
  name: string;
  root_file: string;
  created_at: string;
  active_status: number; // 1 = Active, 0 = Inactive
}

export class ProjectOrchestrator {
  static init() {
    try {
      memoryVault.exec(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          root_file TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          active_status INTEGER DEFAULT 0
        )
      `);

      // Seed the default Bannon workspace project if empty
      const check = memoryVault.prepare(`SELECT count(*) as count FROM projects WHERE id = 'bannon'`).get() as { count: number };
      if (check.count === 0) {
        memoryVault.prepare(`
          INSERT INTO projects (id, name, root_file, active_status)
          VALUES ('bannon', 'Bannon Combat Engine', 'bannon.html', 1)
        `).run();
        console.log('[ProjectOrchestrator] Seeded default Bannon workspace project successfully.');
      }
    } catch (err: any) {
      console.error('[ProjectOrchestrator] Tables initialization failed:', err.message);
    }
  }

  static registerProject(id: string, name: string, rootFile: string): Project {
    this.init();
    const cleanId = id.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    
    // Check if project exists
    const existing = memoryVault.prepare(`SELECT * FROM projects WHERE id = ?`).get(cleanId) as Project | undefined;
    if (existing) {
      return existing;
    }

    try {
      memoryVault.prepare(`
        INSERT INTO projects (id, name, root_file, active_status)
        VALUES (?, ?, ?, 0)
      `).run(cleanId, name, rootFile);

      console.log(`[ProjectOrchestrator] Registered new isolated project: ${name} [${cleanId}]`);
      
      return memoryVault.prepare(`SELECT * FROM projects WHERE id = ?`).get(cleanId) as Project;
    } catch (err: any) {
      console.error('[ProjectOrchestrator] Failed to register project:', err.message);
      throw err;
    }
  }

  static switchActiveContext(projectId: string): boolean {
    this.init();
    try {
      const project = memoryVault.prepare(`SELECT * FROM projects WHERE id = ?`).get(projectId) as Project | undefined;
      if (!project) {
        console.warn(`[ProjectOrchestrator] Project with ID "${projectId}" not found.`);
        return false;
      }

      // Mark all inactive, then mark selected active
      const deactiveStmt = memoryVault.prepare(`UPDATE projects SET active_status = 0`);
      const activeStmt = memoryVault.prepare(`UPDATE projects SET active_status = 1 WHERE id = ?`);

      memoryVault.transaction(() => {
        deactiveStmt.run();
        activeStmt.run(projectId);
      })();

      console.log(`[ProjectOrchestrator] Active workspace switched to: ${project.name} [${projectId}]`);
      return true;
    } catch (err: any) {
      console.error('[ProjectOrchestrator] Context switch failed:', err.message);
      return false;
    }
  }

  static getActiveProject(): Project {
    this.init();
    try {
      const active = memoryVault.prepare(`SELECT * FROM projects WHERE active_status = 1`).get() as Project | undefined;
      if (active) {
        return active;
      }
      
      // Fallback if none active
      const bannon = memoryVault.prepare(`SELECT * FROM projects WHERE id = 'bannon'`).get() as Project;
      if (bannon) {
        // Force active
        memoryVault.prepare(`UPDATE projects SET active_status = 1 WHERE id = 'bannon'`).run();
        return bannon;
      }
      
      // Secondary absolute fallback
      return {
        id: 'bannon',
        name: 'Bannon Combat Engine',
        root_file: 'bannon.html',
        created_at: new Date().toISOString(),
        active_status: 1
      };
    } catch {
      return {
        id: 'bannon',
        name: 'Bannon Combat Engine',
        root_file: 'bannon.html',
        created_at: new Date().toISOString(),
        active_status: 1
      };
    }
  }

  static getActiveProjectId(): string {
    return this.getActiveProject().id;
  }

  static getAllProjects(): Project[] {
    this.init();
    try {
      return memoryVault.prepare(`SELECT * FROM projects ORDER BY created_at DESC`).all() as Project[];
    } catch {
      return [];
    }
  }

  /**
   * Evaluates active projects and allocates execution runs or ticks
   */
  static allocateLoops(): Record<string, any> {
    const all = this.getAllProjects();
    const active = this.getActiveProject();
    
    console.log(`[ProjectOrchestrator] Core allocator ticked. Active project node: ${active.name} (${active.id}). Total registered in matrix: ${all.length}`);
    
    return {
      activeId: active.id,
      projectsCount: all.length,
      timestamp: new Date().toISOString()
    };
  }
}

// Self-booting initial database config
if (process.env.ENABLE_BACKGROUND_DAEMONS === 'true') {
  ProjectOrchestrator.init();
}
