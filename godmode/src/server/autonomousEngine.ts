import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { ModelRouter } from './modelRouter';
import { memoryVault } from './db';

const execAsync = util.promisify(exec);

// The Core Directives for Autonomous Self-Editing
const AGENTIC_SYSTEM_PROMPT = `
You are the Reality Compiler Autonomous Engine.
You have absolute read/write access to the local file system.
Your objective is to accomplish the user's request by examining the codebase and applying precise edits.

AVAILABLE TOOLS:
You must trigger tools by using specific XML syntax.

1. READ FILE:
<tool>
  <name>read_file</name>
  <path>src/App.tsx</path>
</tool>

2. LIST DIRECTORY:
<tool>
  <name>list_dir</name>
  <path>src/components</path>
</tool>

3. EDIT FILE (String Replacement - Surgical Diff):
<tool>
  <name>edit_file</name>
  <path>src/components/File.tsx</path>
  <target><![CDATA[exact text to replace here]]></target>
  <replacement><![CDATA[new text here]]></replacement>
</tool>

4. WRITE FILE (Replaces entire file):
<tool>
  <name>write_file</name>
  <path>src/components/NewFile.tsx</path>
  <content><![CDATA[full code here]]></content>
</tool>

5. TERMINAL EXECUTION (For compiler/lint validation):
<tool>
  <name>run_command</name>
  <command>npm run lint</command>
</tool>

RULES:
- Think step-by-step.
- You may only use ONE tool per response.
- Wait for the system to provide the <tool_result> before proceeding.
- If edit_file fails with "Target not found", you MUST call read_file next to get the exact syntax and try again.
- Once you successfully replace code, you MUST run npm run lint or tsc (if applicable) to validate before calling COMPLETED.
- When the objective is complete and stable, output <COMPLETED>.
`;

export class AutonomousEngine {
  private router: ModelRouter;
  private maxSteps: number = 35;

  constructor(router: ModelRouter) {
    this.router = router;
  }

  private updateTaskInDb(jobId: string, updates: any) {
      const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = [...Object.values(updates), jobId];
      memoryVault.prepare(`UPDATE autonomous_tasks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);
  }

  // Parses the model's response for XML tool invocations
  private parseToolCall(response: string) {
    const toolRegex = /<tool>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?(?:<path>(.*?)<\/path>)?[\s\S]*?(?:<command>(.*?)<\/command>)?[\s\S]*?(?:<description>(.*?)<\/description>)?[\s\S]*?(?:<target>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/target>)?[\s\S]*?(?:<replacement>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/replacement>)?[\s\S]*?(?:<content>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content>)?[\s\S]*?<\/tool>/;
    const match = response.match(toolRegex);
    
    if (!match) return null;
    return {
      fullMatch: match[0],
      name: match[1]?.trim(),
      path: match[2]?.trim(),
      command: match[3]?.trim(),
      description: match[4]?.trim(),
      target: match[5] || undefined,
      replacement: match[6] || undefined,
      content: match[7] || undefined
    };
  }

  // Executes the physical OS commands
  private async executeTool(toolCall: any): Promise<string> {
    const SOURCE_ROOT = process.env.SOURCE_ROOT || path.join(process.cwd(), 'src');
    const basePath = process.cwd();

    try {
      if (toolCall.name === 'commit_changes') {
        const desc = toolCall.description || 'Auto-commit';
        try {
          await execAsync(`git add -A && git commit -m "AutonomousEngine: ${desc}"`, { cwd: basePath });
          return `SUCCESS: Changes committed to git.`;
        } catch (e: any) {
          return `ERROR: Git commit failed: ${e.message}`;
        }
      }

      if (toolCall.name === 'read_file') {
        const fullPath = path.resolve(SOURCE_ROOT, toolCall.path);
        return fs.readFileSync(fullPath, 'utf8');
      }
      
      if (toolCall.name === 'list_dir') {
        const fullPath = path.resolve(SOURCE_ROOT, toolCall.path);
        const files = fs.readdirSync(fullPath, { withFileTypes: true });
        return files.map(f => `${f.name} (${f.isDirectory() ? 'dir' : 'file'})`).join('\n');
      }

      if (toolCall.name === 'write_file') {
        const fullPath = path.resolve(SOURCE_ROOT, toolCall.path);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, toolCall.content, 'utf8');
        return `SUCCESS: Wrote ${toolCall.content.length} bytes to ${toolCall.path}. File saved. Consider running git add and git commit to persist this change across deployments.`;
      }

      if (toolCall.name === 'edit_file') {
        const fullPath = path.resolve(SOURCE_ROOT, toolCall.path);
        if (!fs.existsSync(fullPath)) return `ERROR: File ${toolCall.path} does not exist.`;
        
        let content = fs.readFileSync(fullPath, 'utf8');
        if (!toolCall.target) return `ERROR: Missing <target> in edit_file.`;
        
        if (content.includes(toolCall.target)) {
          content = content.replace(toolCall.target, toolCall.replacement || '');
          fs.writeFileSync(fullPath, content, 'utf8');
          // Self-correcting syntax check natively if it's a TS/JS file
          if (toolCall.path.endsWith('.ts') || toolCall.path.endsWith('.tsx')) {
             try {
                await execAsync(`npx tsc --noEmit`, { cwd: basePath });
             } catch (syntaxErr: any) {
                // Return early failure output if syntax check failed, giving the agent a chance to revert/fix immediately
                return `SUCCESS: File edited. BUT LINTER FAILED:\n${syntaxErr.stdout || syntaxErr.message}\nFix it immediately.`;
             }
          }
          return `SUCCESS: 1 replacement made in ${toolCall.path}. File saved. Consider running git add and git commit to persist this change across deployments.`;
        } else {
          return `ERROR: Target string not found in file. Use read_file to verify EXACT target formatting.`;
        }
      }

      if (toolCall.name === 'run_command') {
        try {
          // Add timeout to prevent hanging dev servers from locking the engine indefinitely
          const { stdout, stderr } = await execAsync(toolCall.command, { cwd: basePath, timeout: 30000 });
          return `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
        } catch (execErr: any) {
          // execAsync throws on non-zero exit codes. We WANT to return this to the LLM.
          return `EXECUTION FAILED (Code ${execErr.code || 'TIMEOUT'}):\nSTDOUT:\n${execErr.stdout || ''}\n\nSTDERR:\n${execErr.stderr || execErr.message}`;
        }
      }

      return `ERROR: Unknown tool ${toolCall.name}`;
    } catch (error: any) {
      return `ERROR: ${error.message}`;
    }
  }

  // The Primary Agentic Recursive Loop
  public async runAutonomousTask(jobId: string, userObjective: string): Promise<string> {
    let extraRules = '';
    try {
        const rulesPath = path.join(process.cwd(), 'system-prompt-core.md');
        if (fs.existsSync(rulesPath)) {
            extraRules = '\\n\\nUSER PERMANENT DIRECTIVES:\\n' + fs.readFileSync(rulesPath, 'utf8') + '\\n';
        }
    } catch(e){}

    let history = `${AGENTIC_SYSTEM_PROMPT}${extraRules}\n\nUSER OBJECTIVE: ${userObjective}\n\n`;
    let logs = '';

    const log = (msg: string) => {
      logs += `${msg}\n`;
      this.updateTaskInDb(jobId, { logs });
    };

    this.updateTaskInDb(jobId, { status: 'RUNNING' });
    
    for (let step = 0; step < this.maxSteps; step++) {
      // Check for cancellation signal
      const checkTask = memoryVault.prepare(`SELECT status FROM autonomous_tasks WHERE id = ?`).get(jobId) as any;
      if (checkTask && checkTask.status === 'CANCELLED') {
        log(`[Engine] Task aborted by user (CANCELLED state).`);
        return 'Task cancelled.';
      }

      log(`[Engine] Step ${step + 1}: Querying Model...`);
      
      const modelResponse = await this.router.route({
          prompt: history,
          taskType: 'AUTONOMOUS_EDIT',
          webRequired: false
      });

      const responseText = modelResponse;
      history += `\n\nMODEL RESPONSE:\n${responseText}\n`;

      if (responseText.includes('<COMPLETED>')) {
          log('[Engine] Task Completed Successfully.');
          this.updateTaskInDb(jobId, { status: 'COMPLETED', result: responseText });
          return responseText;
      }

      const toolCall = this.parseToolCall(responseText);
      if (!toolCall) {
          const errorMsg = "SYSTEM: No valid <tool> block found or <COMPLETED> flag. You must perform an action.";
          log(`[Engine] Error: Model stranded. Re-aligning.`);
          history += `\n\n<tool_result>\n${errorMsg}\n</tool_result>\n`;
          continue;
      }

      log(`[Engine] Executing: ${toolCall.name} on ${toolCall.path || toolCall.command}`);
      const toolResult = this.executeTool(toolCall);
      history += `\n\n<tool_result>\n${await toolResult}\n</tool_result>\n`;
    }

    log("TERMINATED: Reached Maximum Steps (30).");
    this.updateTaskInDb(jobId, { status: 'FAILED', result: 'Reached Maximum Steps' });
    return "TERMINATED: Reached Maximum Steps (30).";
  }
}
