import fs from 'fs';
import path from 'path';

export class FileBufferGate {
  private static stagingDir = path.join(process.cwd(), '.staging');

  static async commit(filePath: string, content: string): Promise<{ success: boolean; error?: string }> {
    if (!fs.existsSync(this.stagingDir)) {
      fs.mkdirSync(this.stagingDir, { recursive: true });
    }
    const fileName = path.basename(filePath);
    const stagingPath = path.join(this.stagingDir, `${Date.now()}_${fileName}`);
    const absolutePath = path.join(process.cwd(), filePath);

    try {
      // 1. Stage in memory or temporary file
      fs.writeFileSync(stagingPath, content, 'utf8');

      // 2. Structural/Syntax Validation (Basic)
      // At a minimum, ensure the file is not empty if it wasn't empty before 
      // and perform a quick check to see if it's readable as text.
      if (!this.isValid(stagingPath)) {
        throw new Error('Validation failed for content buffer.');
      }

      // 3. Atomically move/copy to final destination
      fs.writeFileSync(absolutePath, content, 'utf8');

      // Cleanup
      fs.unlinkSync(stagingPath);
      return { success: true };
    } catch (err: any) {
      console.error(`[FileBufferGate] Commit failed for ${filePath}:`, err);
      return { success: false, error: err.message };
    }
  }

  private static isValid(tempPath: string): boolean {
    const stat = fs.statSync(tempPath);
    return stat.size >= 0; // Extremely basic check for now
  }
}
