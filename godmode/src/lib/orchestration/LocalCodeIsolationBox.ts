import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export class LocalCodeIsolationBox {
  /**
   * Safely writes code to a temporary scratchpad and runs the TypeScript compiler (noEmit)
   * to ensure syntax correctness before the agent can commit it to the main tree.
   * Returns an object indicating success or failure, and the compiler output.
   */
  static async validateCode(codeContent: string): Promise<{ success: boolean; output: string }> {
    const scratchpadDir = path.resolve(process.cwd(), 'src/staging');
    const scratchpadFile = path.join(scratchpadDir, 'temp.ts');

    try {
      // Ensure staging directory exists
      if (!fs.existsSync(scratchpadDir)) {
        fs.mkdirSync(scratchpadDir, { recursive: true });
      }

      // Write the speculative code to the sandbox
      fs.writeFileSync(scratchpadFile, codeContent, 'utf-8');

      // Execute local lint/typecheck
      console.log(`[ISOLATION BOX] Spawning child process to validate speculative code...`);
      const { stdout, stderr } = await execAsync(`npx tsc --noEmit ${scratchpadFile}`);
      
      // If we reach here, exit code was 0
      console.log(`[ISOLATION BOX] Code validation passed. No structural errors found.`);
      return { success: true, output: stdout };

    } catch (error: any) {
      // Process exited with non-zero code
      console.log(`[ISOLATION BOX] Validation FAILED. Error intercepted.`);
      return { success: false, output: error.stdout || error.stderr || error.message };
    } finally {
      // Cleanup scratchpad
      if (fs.existsSync(scratchpadFile)) {
        fs.unlinkSync(scratchpadFile);
      }
    }
  }
}
