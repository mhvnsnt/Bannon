import { fs as memfs, vol } from 'memfs';

export class VirtualFileSystem {
  /**
   * Initializes the virtual file system with a set of files
   */
  static initialize(files: Record<string, string>) {
    vol.fromJSON(files, '/vfs');
    console.log("[VFS] Virtual File System initialized with staged files.");
  }

  /**
   * Reads a file from the staging area
   */
  static readStagedFile(filePath: string): string {
    try {
      return memfs.readFileSync(`/vfs/${filePath}`, { encoding: 'utf8' }) as string;
    } catch (err: any) {
      throw new Error(`File not found in VFS: ${filePath}`);
    }
  }

  /**
   * Writes a file to the staging area in memory
   */
  static writeStagedFile(filePath: string, content: string) {
    memfs.writeFileSync(`/vfs/${filePath}`, content, { encoding: 'utf8' });
    console.log(`[VFS] Staged write to ${filePath}`);
  }

  /**
   * Emulates the atomic commit to the live disk
   */
  static dumpToDisk() {
    console.log("[VFS] Executing atomic commit from VFS to live filesystem...");
    const json = vol.toJSON();
    // A live implementation would iterate through 'json' and perform fs.writeFileSync
    console.log(`[VFS] Atomic commit complete for ${Object.keys(json).length} file(s).`);
  }
}
