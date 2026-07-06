import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export class DynamicToolForge {
  static async buildAndExecute(taskName: string, scriptContent: string): Promise<string> {
    console.log(`[TOOL FORGE] Agent synthesizing new actuator for: ${taskName}`);
    
    const dirPath = './src/tools/dynamic';
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    const filePath = path.join(dirPath, `${taskName.replace(/\\s+/g, '_')}.js`);
    fs.writeFileSync(filePath, scriptContent);

    try {
      // The swarm runs the tool it just built
      const { stdout } = await execAsync(`node ${filePath}`);
      return stdout;
    } catch (error: any) {
      return `[FORGE ERROR] Tool failed. Rewrite the script and try again. Error: ${error.message}`;
    }
  }
}
