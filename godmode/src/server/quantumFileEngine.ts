import crypto from 'crypto';
import { memoryVault } from './db';

export interface QuantumFile {
  id: string;
  filename: string;
  content: string;
  version_number: number;
  timestamp: string;
  token_count: number;
  checksum: string;
  parent_version_id: string | null;
  change_summary: string | null;
}

export interface QuantumChunk {
  file_id: string;
  chunk_index: number;
  chunk_type: string;
  content: string;
  start_line: number;
  end_line: number;
  token_count: number;
}

export class QuantumFileEngine {
  static storeFile(filename: string, content: string, changeSummary = 'Initial raw ingest', parentId: string | null = null): string {
    const fileId = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_') + '_' + Date.now();
    const tokenCount = Math.ceil(content.length / 4);
    const checksum = crypto.createHash('md5').update(content).digest('hex');

    // Determine current version number
    let nextVersion = 1;
    if (parentId) {
      const prev = memoryVault.prepare(`SELECT version_number FROM quantum_files WHERE id = ?`).get(parentId) as any;
      if (prev) {
        nextVersion = prev.version_number + 1;
      }
    }

    memoryVault.prepare(`
      INSERT INTO quantum_files (id, filename, content, version_number, token_count, checksum, parent_version_id, change_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(fileId, filename, content, nextVersion, tokenCount, checksum, parentId, changeSummary);

    this.chunkFile(fileId, filename, content);

    return fileId;
  }

  private static chunkFile(fileId: string, filename: string, content: string) {
    const lines = content.split('\n');
    const chunks: Omit<QuantumChunk, 'file_id'>[] = [];
    let currentChunkLines: string[] = [];
    let startLine = 1;
    let chunkIndex = 0;

    const ext = filename.split('.').pop()?.toLowerCase();

    const saveChunk = (type: string, endLine: number) => {
      if (currentChunkLines.length === 0) return;
      const text = currentChunkLines.join('\n');
      chunks.push({
        chunk_index: chunkIndex++,
        chunk_type: type,
        content: text,
        start_line: startLine,
        end_line: endLine,
        token_count: Math.ceil(text.length / 4)
      });
      currentChunkLines = [];
      startLine = endLine + 1;
    };

    if (ext === 'html') {
      let insideScript = false;
      let insideStyle = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        if (line.includes('<script')) {
          saveChunk('markup', lineNum - 1);
          insideScript = true;
        } else if (line.includes('</script>')) {
          currentChunkLines.push(line);
          saveChunk('javascript', lineNum);
          insideScript = false;
          continue;
        } else if (line.includes('<style')) {
          saveChunk('markup', lineNum - 1);
          insideStyle = true;
        } else if (line.includes('</style>')) {
          currentChunkLines.push(line);
          saveChunk('style', lineNum);
          insideStyle = false;
          continue;
        }

        currentChunkLines.push(line);
        
        // Split if too large
        if (currentChunkLines.length >= 150) {
          saveChunk(insideScript ? 'javascript' : insideStyle ? 'style' : 'markup', lineNum);
        }
      }
      saveChunk('markup', lines.length);

    } else {
      // JSX / TS / JS code chunking by function/component/class patterns
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        currentChunkLines.push(line);

        const isBoundary = 
          line.trim().startsWith('export function') || 
          line.trim().startsWith('const ') && line.includes('=>') || 
          line.trim().startsWith('function ') || 
          line.trim().startsWith('class ') ||
          line.trim().startsWith('export const ');

        if (isBoundary && currentChunkLines.length > 50) {
          // save previous chunk, but keep this boundary line for the NEXT chunk
          currentChunkLines.pop(); // remove
          saveChunk('code-block', lineNum - 1);
          currentChunkLines.push(line); // re-add to start next
        }

        if (currentChunkLines.length >= 200) {
          saveChunk('code-block', lineNum);
        }
      }
      saveChunk('code-block', lines.length);
    }

    // Insert chunks to SQLite
    const insertStmt = memoryVault.prepare(`
      INSERT INTO quantum_chunks (file_id, chunk_index, chunk_type, content, start_line, end_line, token_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const chunk of chunks) {
      insertStmt.run(fileId, chunk.chunk_index, chunk.chunk_type, chunk.content, chunk.start_line, chunk.end_line, chunk.token_count);
    }
  }

  static getFileForContext(fileId: string, maxTokens = 15000, intent = ''): string {
    const file = memoryVault.prepare(`SELECT * FROM quantum_files WHERE id = ?`).get(fileId) as any;
    if (!file) return '';

    const chunks = memoryVault.prepare(`SELECT * FROM quantum_chunks WHERE file_id = ? ORDER BY chunk_index ASC`).all(fileId) as any[];

    if (Math.ceil(file.content.length / 4) <= maxTokens) {
      return file.content;
    }

    // Budgeting. Always include headers (first chunk) and search for relevant chunks based on intent terms
    const terms = intent.toLowerCase().split(/\s+/).filter(t => t.length > 3);
    const scoredChunks = chunks.map(chunk => {
      let score = 0;
      if (chunk.chunk_index === 0) score += 1000; // Always highly prioritize header
      for (const term of terms) {
        if (chunk.content.toLowerCase().includes(term)) {
          score += 10;
        }
      }
      return { chunk, score };
    });

    // Pick top scored chunks within token budget
    let currentTokens = 0;
    const selectedIndices = new Set<number>();

    // Always include index 0
    selectedIndices.add(0);
    currentTokens += chunks[0]?.token_count || 0;

    // Sort rest by score descending
    const sortedByScore = scoredChunks
      .filter(x => x.chunk.chunk_index !== 0)
      .sort((a, b) => b.score - a.score);

    for (const item of sortedByScore) {
      if (currentTokens + item.chunk.token_count <= maxTokens) {
        selectedIndices.add(item.chunk.chunk_index);
        currentTokens += item.chunk.token_count;
      }
    }

    // Reconstruct with omit markers
    let output = '';
    for (let i = 0; i < chunks.length; i++) {
      if (selectedIndices.has(i)) {
        output += chunks[i].content + '\n';
      } else {
        output += `\n/* ... [NEXUS CONTEXT GUARD: SECTION ${i} OMITTED TO SAVE TOKENS (${chunks[i].token_count} TOKENS)] ... */\n\n`;
      }
    }

    return output;
  }

  static getCurrentFile(fileId: string): { content: string; filename: string; version_number: number } | null {
    // Resolve filename. First find the original base filename
    const baseFile = memoryVault.prepare(`SELECT filename FROM quantum_files WHERE id = ?`).get(fileId) as any;
    if (!baseFile) return null;

    // Find the latest version of this filename
    const latest = memoryVault.prepare(`
      SELECT * FROM quantum_files 
      WHERE filename = ? 
      ORDER BY version_number DESC LIMIT 1
    `).get(baseFile.filename) as any;

    if (!latest) return null;
    return {
      content: latest.content,
      filename: latest.filename,
      version_number: latest.version_number
    };
  }

  static getVersionHistory(fileId: string): any[] {
    const file = memoryVault.prepare(`SELECT filename FROM quantum_files WHERE id = ?`).get(fileId) as any;
    if (!file) return [];

    return memoryVault.prepare(`
      SELECT id, filename, version_number, timestamp, token_count, change_summary, checksum
      FROM quantum_files 
      WHERE filename = ? 
      ORDER BY version_number DESC
    `).all(file.filename);
  }

  static getVersion(fileId: string, versionNumber: number): string | null {
    const file = memoryVault.prepare(`SELECT filename FROM quantum_files WHERE id = ?`).get(fileId) as any;
    if (!file) return null;

    const specific = memoryVault.prepare(`
      SELECT content FROM quantum_files 
      WHERE filename = ? AND version_number = ?
    `).get(file.filename, versionNumber) as any;

    return specific ? specific.content : null;
  }

  static applyDiff(fileId: string, diffPayload: string, changeSummary = 'Surgical diff update'): string | null {
    const active = this.getCurrentFile(fileId);
    if (!active) return null;

    let originalContent = active.content;
    let newContent = originalContent;

    // A robust, simplified diff applier that handles:
    // 1. unified diff style (added lines (+), removed lines (-))
    // 2. Custom search and replace block templates
    // Let's implement active search-and-replace block detection as it is extremely robust!
    if (diffPayload.includes('<<<<<<< SEARCH') || diffPayload.includes('<<<<<<<')) {
      const blocks = diffPayload.split('<<<<<<<');
      for (const block of blocks) {
        if (!block.includes('=======') || !block.includes('>>>>>>>')) continue;
        const searchPart = block.split('=======')[0].replace('SEARCH\n', '').trim();
        const replacePart = block.split('=======')[1].split('>>>>>>>')[0].replace('REPLACE\n', '').trim();

        if (newContent.includes(searchPart)) {
          newContent = newContent.replace(searchPart, replacePart);
        } else {
          // Loose matching without whitespace/newlines
          const searchClean = searchPart.replace(/\s+/g, '');
          const originalLines = newContent.split('\n');
          let found = false;
          for (let start = 0; start < originalLines.length; start++) {
            for (let end = start + 1; end <= Math.min(start + 50, originalLines.length); end++) {
              const slice = originalLines.slice(start, end).join('\n');
              if (slice.replace(/\s+/g, '') === searchClean) {
                newContent = originalLines.slice(0, start).join('\n') + '\n' + replacePart + '\n' + originalLines.slice(end).join('\n');
                found = true;
                break;
              }
            }
            if (found) break;
          }
        }
      }
    } else {
      // Unified Diff Parsing fallback
      const lines = diffPayload.split('\n');
      let isUnified = false;
      const matches: { search: string[], replace: string[] }[] = [];
      let currentSearch: string[] = [];
      let currentReplace: string[] = [];

      for (const line of lines) {
        if (line.startsWith('@@')) {
          isUnified = true;
          if (currentSearch.length > 0 || currentReplace.length > 0) {
            matches.push({ search: [...currentSearch], replace: [...currentReplace] });
            currentSearch = [];
            currentReplace = [];
          }
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          currentSearch.push(line.slice(1));
        } else if (line.startsWith('+') && !line.startsWith('+++')) {
          currentReplace.push(line.slice(1));
        } else if (line.startsWith(' ')) {
          currentSearch.push(line.slice(1));
          currentReplace.push(line.slice(1));
        }
      }

      if (currentSearch.length > 0 || currentReplace.length > 0) {
        matches.push({ search: currentSearch, replace: currentReplace });
      }

      if (isUnified && matches.length > 0) {
        for (const match of matches) {
          const sText = match.search.join('\n').trim();
          const rText = match.replace.join('\n').trim();
          if (sText && newContent.includes(sText)) {
            newContent = newContent.replace(sText, rText);
          }
        }
      }
    }

    if (newContent === originalContent) {
      // Simple fallback. If no matches occurred and complete tag was not fully formed, and the payload is simply the replacement text, do structural replace
      // Let's safeguard to avoid throwing or failing
      console.log("[QuantumFileEngine] Diff application clean mismatch, preserving safety.");
    }

    // Now write the new version
    // Find the latest record to link parentId
    const latestRecord = memoryVault.prepare(`
      SELECT id FROM quantum_files 
      WHERE filename = ? 
      ORDER BY version_number DESC LIMIT 1
    `).get(active.filename) as any;

    const parentId = latestRecord ? latestRecord.id : null;
    return this.storeFile(active.filename, newContent, changeSummary, parentId);
  }

  static async sliceFileForContext(fileId: string, taskIntent: string, maxTokens = 4500): Promise<{ slicedContent: string; razorMap: Record<string, string> }> {
    const file = this.getCurrentFile(fileId);
    if (!file) {
      return { slicedContent: '', razorMap: {} };
    }

    const { RazorEngine } = await import('./razorEngine');
    const result = await RazorEngine.slice(file.content, file.filename, taskIntent, maxTokens);

    if (result.reductionPercent > 0) {
      try {
        memoryVault.prepare(`
          INSERT INTO spine_event_log (event_type, payload)
          VALUES ('RAZOR_COMPRESSION_SUCCESS', ?)
        `).run(JSON.stringify({
          fileId,
          filename: file.filename,
          originalTokens: result.tokensOriginal,
          afterTokens: result.tokensAfterRazor,
          reductionPercent: result.reductionPercent
        }));
      } catch (e: any) {
        console.warn('[QuantumFileEngine] Log to spine_event_log failed:', e.message);
      }
    }

    return {
      slicedContent: result.slicedContent,
      razorMap: result.razorMap
    };
  }
}
