import { logConversation } from '../../../server/conversation_logger';
import fs from 'fs/promises';
import path from 'path';

const DIAG_DIR = path.join(process.cwd(), 'diagnostics');

export async function recordProviderCall(meta: { provider?: string; model?: string; taskId?: string }, reqBody: any, resBody: any, timingMs?: number) {
  try {
    await fs.mkdir(DIAG_DIR, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const file = path.join(DIAG_DIR, `provider_call_${meta.provider || 'unknown'}_${ts}.json`);
    await fs.writeFile(file, JSON.stringify({ meta, reqBody, resBody, timingMs, timestamp: new Date().toISOString() }, null, 2));
  } catch (e: any) {
    console.error('[memory_logger] failed to write provider diagnostic:', e && e.message);
  }

  // Also log to conversation memory (assistant role)
  try {
    const assistantText = typeof resBody === 'string' ? resBody : (resBody?.text || JSON.stringify(resBody));
    await logConversation('assistant', assistantText, { provider: meta.provider, model: meta.model, taskId: meta.taskId });
  } catch (e) {
    console.error('[memory_logger] failed to log conversation entry for provider call:', e && e.message);
  }
}

export async function recordUserPrompt(prompt: string, meta: any = {}) {
  try {
    await logConversation('user', prompt, meta);
  } catch (e: any) {
    console.error('[memory_logger] failed to record user prompt:', e && e.message);
  }
}
