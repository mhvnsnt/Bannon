import fs from 'fs/promises';
import path from 'path';

const MEMORY_FILE = path.join(process.cwd(), 'CONVERSATION_MEMORY.json');
const TRANSCRIPT_FILE = path.join(process.cwd(), 'CONVERSATION_TRANSCRIPT.log');
const MAX_ENTRIES = 1000; // rotate after this many entries

let REDACT = process.env.CONVERSATION_REDACT !== 'no';

function redactText(s: string) {
  if (!s || !REDACT) return s;
  // redact obvious API keys / long tokens
  // common prefixes: sk-, gsk_, AKIA,AIza, etc. and long base64-like strings
  s = s.replace(/(?:sk-[A-Za-z0-9-_]{24,}|gsk_[A-Za-z0-9-_]{16,}|AIza[0-9A-Za-z-_]{35,}|AKIA[0-9A-Z]{16,}|[A-Za-z0-9+/]{40,}=*)/g, '[REDACTED_KEY]');
  // redact long base64/blobs
  s = s.replace(/(?:[A-Za-z0-9+/]{100,}=*)/g, '[REDACTED_BLOB]');
  return s;
}

export async function logConversation(role: 'user'|'assistant'|'system'|'agent', content: string, meta: any = {}) {
  const timestamp = new Date().toISOString();
  const entry = { timestamp, role, content: REDACT ? redactText(content) : content, meta };

  // atomic read/modify/write for JSON memory
  try {
    let arr: any[] = [];
    try {
      const raw = await fs.readFile(MEMORY_FILE, 'utf8');
      arr = JSON.parse(raw || '[]');
    } catch (e) {
      arr = [];
    }
    arr.push(entry);
    if (arr.length > MAX_ENTRIES) arr = arr.slice(-MAX_ENTRIES);
    const tmp = MEMORY_FILE + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(arr, null, 2));
    await fs.rename(tmp, MEMORY_FILE);
  } catch (e: any) {
    console.error('[conversation_logger] failed to write memory file:', e && e.message);
  }

  // append human readable transcript
  try {
    const line = `[${timestamp}] ${role.toUpperCase()}${meta && meta.provider ? ' @' + meta.provider : ''}: ${REDACT ? redactText(content) : content}\n`;
    await fs.appendFile(TRANSCRIPT_FILE, line);
  } catch (e: any) {
    console.error('[conversation_logger] failed to append transcript:', e && e.message);
  }
}

export function setRedaction(enabled: boolean) { REDACT = enabled; }
