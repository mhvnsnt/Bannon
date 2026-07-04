import express from 'express';
import { exec } from 'child_process';
import util from 'util';

export const terminalRoutes = express.Router();
const execPromise = util.promisify(exec);

terminalRoutes.post('/execute', async (req, res) => {
  try {
    const { command, cwd = process.cwd() } = req.body;
    
    // Safety check - extremely permissive but block obvious danger vectors if needed
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Command required' });
    }

    console.log(`[Actuator/Terminal] Executing payload: ${command}`);
    
    // Capture stdout and stderr
    try {
      const { stdout, stderr } = await execPromise(command, { cwd, timeout: 60000 });
      res.json({ success: true, output: stdout, errorOutput: stderr, exitCode: 0 });
    } catch (cmdErr: any) {
      res.json({ 
        success: false, 
        output: cmdErr.stdout || '', 
        errorOutput: cmdErr.stderr || cmdErr.message, 
        exitCode: cmdErr.code || 1 
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
