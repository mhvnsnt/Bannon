import { exec } from 'child_process';
import path from 'path';
import cron from 'node-cron';

export class GitVault {
  static start() {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      console.log('[GitVault] Creating temporal snapshot...');
      this.commit().catch(console.error);
    });
    console.log('[GitVault] Git temporal ledger started.');
  }

  static async commit(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Basic auto-commit
      const cmd = `git add . && git commit -m "chore: temporal snapshot ${new Date().toISOString()}" --no-verify`;
      exec(cmd, { cwd: process.cwd() }, (error, stdout, stderr) => {
        if (error && !error.message.includes('nothing to commit')) {
          console.error('[GitVault] Commit failed:', stderr);
          reject(error);
          return;
        }
        console.log('[GitVault] Snapshot successfully committed.');
        resolve();
      });
    });
  }
}
