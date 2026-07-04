import { memoryVault } from './db';
import { QuantumFileEngine } from './quantumFileEngine';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class QuantumContextManager {
  static getSession(sessionId: string, fileId: string): { messages: ChatMessage[]; totalTokens: number } {
    const row = memoryVault.prepare(`SELECT * FROM quantum_conversations WHERE session_id = ? AND file_id = ?`).get(sessionId, fileId) as any;
    if (row) {
      return {
        messages: JSON.parse(row.messages) as ChatMessage[],
        totalTokens: row.total_tokens_used || 0
      };
    }
    return { messages: [], totalTokens: 0 };
  }

  static saveMessage(sessionId: string, fileId: string, role: 'user' | 'assistant' | 'system', content: string) {
    const existing = this.getSession(sessionId, fileId);
    const messages = [...existing.messages, { role, content }];
    const totalTokens = Math.ceil(messages.reduce((acc, m) => acc + m.content.length, 0) / 4);

    const serialized = JSON.stringify(messages);
    memoryVault.prepare(`
      INSERT INTO quantum_conversations (id, session_id, file_id, messages, total_tokens_used)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        messages = excluded.messages,
        total_tokens_used = excluded.total_tokens_used,
        last_active = CURRENT_TIMESTAMP
    `).run(sessionId + '_' + fileId, sessionId, fileId, serialized, totalTokens);
  }

  static compressHistory(messages: ChatMessage[], maxLimit = 8000): { compressed: ChatMessage[]; status: string } {
    const estimate = (content: string) => Math.ceil(content.length / 4);
    const totalEst = messages.reduce((acc, m) => acc + estimate(m.content), 0);

    if (totalEst < maxLimit * 0.6) {
      return { compressed: messages, status: 'STANDARD (FULL)' };
    }

    if (totalEst < maxLimit * 0.8) {
      // Summarize oldest, keep last 10 verbatim
      const keepCount = 10;
      if (messages.length <= keepCount) return { compressed: messages, status: 'STANDARD' };
      
      const toSummarize = messages.slice(0, messages.length - keepCount);
      const toKeep = messages.slice(messages.length - keepCount);
      
      const summaryText = toSummarize.map(m => `[${m.role.toUpperCase()}]: ${m.content.slice(0, 100)}...`).join('\n');
      const condensedMsg: ChatMessage = {
        role: 'system',
        content: `[NEXUS CONTEXT ENGINE CONTEXT CONDENSED]\nSummary of earlier thread:\n${summaryText}`
      };

      return {
        compressed: [condensedMsg, ...toKeep],
        status: 'COMPRESSED (LAST 10 KEEP)'
      };
    }

    // Aggressive compression: keep last 5 verbatim, summarize completely
    const keepCount = 5;
    if (messages.length <= keepCount) return { compressed: messages, status: 'STANDARD' };

    const toSummarize = messages.slice(0, messages.length - keepCount);
    const toKeep = messages.slice(messages.length - keepCount);
    
    const summaryText = toSummarize.map(m => `- ${m.role}: ${m.content.slice(0, 80)}`).join('\n');
    const condensedMsg: ChatMessage = {
      role: 'system',
      content: `[NEXUS CONTEXT ENGINE MAXIMUM COMPRESSION ACTIVE]\nDense history audit:\n${summaryText}`
    };

    return {
      compressed: [condensedMsg, ...toKeep],
      status: 'MAXIMUM COMPRESSION ACTIVE (LAST 5 KEEP)'
    };
  }

  static async buildPrompt(sessionId: string, fileId: string, userMessage: string, taskIntent = '', useRazor = false): Promise<{ prompt: string; tokenCount: number; compressionStatus: string; razorMap?: Record<string, string> }> {
    const { messages } = this.getSession(sessionId, fileId);
    
    // Compress conversational elements
    const { compressed, status } = this.compressHistory(messages);

    // Fetch core state
    const designDna = memoryVault.prepare(`SELECT config_value FROM dna_archive ORDER BY timestamp DESC LIMIT 1`).get() as any;
    const projectIdentity = memoryVault.prepare(`SELECT content FROM memory_user_edits LIMIT 1`).get() as any;

    let fileContext = '';
    let razorMap: Record<string, string> | undefined = undefined;

    if (useRazor) {
      console.log(`[QuantumContextManager] Razor slicing is active for fileId: ${fileId}`);
      const sliceRes = await QuantumFileEngine.sliceFileForContext(fileId, taskIntent || userMessage, 4500);
      fileContext = sliceRes.slicedContent;
      razorMap = sliceRes.razorMap;
    } else {
      fileContext = QuantumFileEngine.getFileForContext(fileId, 25000, taskIntent || userMessage);
    }

    const systemPrompt = `You are the Quantum Build Engine of the NexusOperatingSystem. You are powered by state-of-the-art intelligence (such as the Claude Fable 5 or Mythos 5 architecture). You have been given the current state of a workspace file and a modification request. You have full awareness of the project DNA, roadmap, and history from the context injected above. Your rules: 1) Never hallucinate — if you are not certain a change is correct, say so in ANALYSIS and propose the safest version. 2) Always respond in the exact tagged format: ANALYSIS, DIFF, FULL_FILE, PREVIEW_READY, CHANGE_SUMMARY. 3) For files under 50k tokens always include FULL_FILE. For files over 50k tokens include only DIFF. 4) Every change must be surgical — touch only what the request requires. 5) The user's creative direction overrides everything. Use your exceptional reasoning abilities (comparable to Fable 5's software engineering benchmarks) to ensure flawless production quality logic.`;

    const chatSegments: string[] = [];
    chatSegments.push(`=== DESIGN SYSTEM DNA ===\n${designDna ? designDna.config_value : 'Default'}`);
    chatSegments.push(`=== KINETIC IDENTITY ===\n${projectIdentity ? projectIdentity.content : 'Generic'}`);
    chatSegments.push(`=== THE LIVE WORKSPACE FILE ===\n${fileContext}`);
    
    for (const msg of compressed) {
      chatSegments.push(`[${msg.role.toUpperCase()}]: ${msg.content}`);
    }

    chatSegments.push(`[USER DIRECTIVE]: ${userMessage}`);
    chatSegments.push(`\n=== DEPLOYMENT DIRECTIVES ===\n${systemPrompt}`);

    const prompt = chatSegments.join('\n\n');
    const tokenCount = Math.ceil(prompt.length / 4);

    return { prompt, tokenCount, compressionStatus: status, razorMap };
  }
}
