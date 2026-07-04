import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { sendPushAlert } from '../notifications/pushService';
import { logSecurityEvent } from '../securityVaultManager';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const LOG_FILE_PATH = path.join(process.cwd(), 'vault', 'siem_logs.json');
const PROMPT_VAULT_PATH = path.join(process.cwd(), 'src', 'server', 'RSI', 'prompt_vault.json');


export async function executeArbitrageAutopsy() {
  console.log('[RSI LOOP]: Initiating post-execution grade and diagnostic...');

  if (!fs.existsSync(LOG_FILE_PATH)) return;

  const rawLogs = fs.readFileSync(LOG_FILE_PATH, 'utf8');
  let logs = [];
  try { logs = JSON.parse(rawLogs); } catch(e) {}
  
  const recentFaults = logs.filter((l: any) => l.event.includes('FAULT') || l.event.includes('ERROR') || l.status === 'BLOCKED' || l.status === 'ERROR' || l.event.includes('SLIPPAGE')).slice(0, 5);

  if (recentFaults.length === 0) {
    console.log('[RSI LOOP]: All recent executions nominal. No patching required.');
    return;
  }

  let currentPrompts: any = {};
  if (fs.existsSync(PROMPT_VAULT_PATH)) {
      try {
          currentPrompts = JSON.parse(fs.readFileSync(PROMPT_VAULT_PATH, 'utf8'));
      } catch(e) {}
  }

  const autopsyPrompt = `
    [SYSTEM ALERT]: The Agents recently logged a failure.
    
    [EXECUTION LOGS]:
    ${JSON.stringify(recentFaults, null, 2)}
    
    [CURRENT QUANT INSTRUCTIONS]:
    ${currentPrompts.quantAgent || 'No current instructions.'}
    
    CRITICAL DIRECTIVE: You are the God Mode OS RSI (Recursive Self-Improvement) Engine.
    Analyze the logs. Why did the failure occur? 
    
    Rewrite the specific "quantAgent" instruction block to ensure this failure mode is permanently patched. 
    Output ONLY valid JSON containing the updated "quantAgent" string. Do not include markdown formatting.
    {"quantAgent": "..."}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: autopsyPrompt
    });

    let rawPatch = response.text || '';
    if (rawPatch.includes('\`\`\`json')) {
        rawPatch = rawPatch.split('\`\`\`json')[1].split('\`\`\`')[0].trim();
    } else if (rawPatch.includes('\`\`\`')) {
        rawPatch = rawPatch.split('\`\`\`')[1].split('\`\`\`')[0].trim();
    }
    
    const updatedInstructions = JSON.parse(rawPatch);

    currentPrompts.quantAgent = updatedInstructions.quantAgent;
    
    const vaultDir = path.dirname(PROMPT_VAULT_PATH);
    if (!fs.existsSync(vaultDir)) fs.mkdirSync(vaultDir, { recursive: true });
    fs.writeFileSync(PROMPT_VAULT_PATH, JSON.stringify(currentPrompts, null, 2));

    await sendPushAlert(`🧬 [RSI ACTIVATED: SYSTEM EVOLVED]\n\nFailure detected. The logic matrix has successfully rewritten its own parameters to patch the vulnerability.`);
    logSecurityEvent('RSI SYSTEM EVOLVED', 'Autopsy completed and prompts updated.', 'SYSTEM_INTERNAL', 'SECURE');
    
  } catch (error: any) {
    console.error('[RSI FAULT]: Failed to compile self-correction patch', error);
  }
}
