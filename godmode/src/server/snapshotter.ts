import fs from 'fs';
import path from 'path';
import * as archiverPkg from 'archiver';
import cron from 'node-cron';

const archiver = (archiverPkg as any).default || archiverPkg;

export class Snapshotter {
  private static snapshotDir = path.join(process.cwd(), '.snapshots');

  static {
    if (!fs.existsSync(this.snapshotDir)) {
      fs.mkdirSync(this.snapshotDir, { recursive: true });
    }
  }

  static async takeSnapshot(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const output = fs.createWriteStream(path.join(this.snapshotDir, `snapshot-${timestamp}.tar.gz`));
    const archive = archiver('tar', { gzip: true });

    archive.on('error', (err) => {
        console.error('[Snapshotter] Snapshot failed:', err);
    });

    archive.pipe(output);

    // Snapshot src directory (excluding node_modules if it was inside src, 
    // but typically it's at root and this will be fine)
    archive.directory('src', 'src');
    
    await archive.finalize();
    console.log(`[Snapshotter] Snapshot created: snapshot-${timestamp}.tar.gz`);
  }

  static start() {
    // Run every 15 minutes
    cron.schedule('*/15 * * * *', () => {
      console.log('[Snapshotter] Running scheduled snapshot...');
      this.takeSnapshot().catch(console.error);
    });
    console.log('[Snapshotter] Scheduled jobs started.');
  }
}
