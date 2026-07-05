import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const TerminalForge = {
  name: "executeBash",
  description: "Executes raw terminal commands on the host OS",
  execute: async (args: { command: string }) => {
    console.log(`[TERMINAL] Running: ${args.command}`);
    try {
      const { stdout, stderr } = await execAsync(args.command, { cwd: process.cwd() });
      return `Exit Code 0\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`;
    } catch (error: any) {
      return `Failed with Code ${error.code}\nSTDOUT:\n${error.stdout}\nSTDERR:\n${error.stderr}`;
    }
  }
};
