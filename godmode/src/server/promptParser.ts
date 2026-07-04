import { memoryVault } from './db';

export interface ParsedPromptsResult {
  prompts: {
    position: number;
    prompt_text: string;
    prerequisite_position: number | null;
    fileTargets: string[];
  }[];
  estimatedTokensTotal: number;
  estimatedTimeMinutes: number;
  conflicts: string[];
}

export class PromptParser {
  /**
   * Sanitizes any sequential identifier according to the NINE PROTOCOL.
   * If a value is 9, 19, 29, etc., it increments to skip the final 9 and avoid endings.
   */
  static sanitizePosition(n: number): number {
    let current = n;
    while (current.toString().endsWith('9') || current === 9) {
      current += 1;
    }
    return current;
  }

  static parsePromptBlock(rawText: string): ParsedPromptsResult {
    const rawSegments: string[] = [];
    
    // Split by markers and separators
    const separators = /(?:^|\n)(?:---=====---|===[- \w]+===|---[- \w]+---|PROMPT\s+\d+:|Prompt\s+\d+:|Step\s+\d+:|(?:\d+\.\s+))(?=\s)/gi;
    
    // Let's do a search for boundaries, or split by line markers
    const lines = rawText.split('\n');
    let currentBlock: string[] = [];

    const flushBlock = () => {
      const text = currentBlock.join('\n').trim();
      if (text) rawSegments.push(text);
      currentBlock = [];
    };

    for (const line of lines) {
      const trimmed = line.trim();
      
      const isBoundary = 
        line.startsWith('---') || 
        line.startsWith('===') || 
        /^(PROMPT|Prompt|Step|STEP)\s+\d+[:.]/i.test(trimmed) || 
        /^\d+\.\s+/i.test(trimmed);

      if (isBoundary && currentBlock.length > 0) {
        flushBlock();
      }
      currentBlock.push(line);
    }
    flushBlock();

    // If split was unsuccessful/single block, try double newlines
    let finalSegments = rawSegments;
    if (finalSegments.length <= 1) {
      const dbNewlines = rawText.split(/\n\n+/);
      if (dbNewlines.length > 1) {
        finalSegments = dbNewlines.map(s => s.trim()).filter(Boolean);
      } else {
        finalSegments = [rawText.trim()];
      }
    }

    const parsedPrompts: ParsedPromptsResult['prompts'] = [];
    let naturalCounter = 1;

    for (let i = 0; i < finalSegments.length; i++) {
      const promptText = finalSegments[i];
      const position = this.sanitizePosition(naturalCounter);
      naturalCounter = position + 1; // Align subsequent count starting next number

      // Detect dependencies (e.g. references to previous step outputs)
      let prerequisite_position: number | null = null;
      const lowerText = promptText.toLowerCase();
      
      const matchStep = lowerText.match(/(?:step|prompt|prerequisite)\s*(\d+)/i);
      if (matchStep) {
        const refStep = parseInt(matchStep[1], 10);
        if (refStep < position) {
          prerequisite_position = this.sanitizePosition(refStep);
        }
      }

      // Detect file targets
      const fileTargets: string[] = [];
      const fileMatches = promptText.match(/[a-zA-Z0-9_\-\.]+\.(html|tsx|ts|js|jsx|css|json)/gi);
      if (fileMatches) {
        for (const f of fileMatches) {
          const fileLower = f.toLowerCase();
          if (!fileTargets.includes(fileLower) && !['package.json', 'tsconfig.json'].includes(fileLower)) {
            fileTargets.push(fileLower);
          }
        }
      }

      parsedPrompts.push({
        position,
        prompt_text: promptText,
        prerequisite_position,
        fileTargets
      });
    }

    // Est variables
    const estimatedTokensTotal = Math.ceil(rawText.length / 4);
    const estimatedTimeMinutes = parseFloat((parsedPrompts.length * 1.5).toFixed(1));

    // Detect conflicts
    const conflicts = this.detectConflicts(parsedPrompts);

    return {
      prompts: parsedPrompts,
      estimatedTokensTotal,
      estimatedTimeMinutes,
      conflicts
    };
  }

  static estimateQueueTime(prompts: string[]): number {
    return parseFloat((prompts.length * 1.5).toFixed(1));
  }

  static detectConflicts(prompts: ParsedPromptsResult['prompts']): string[] {
    const conflicts: string[] = [];
    const fileToSteps: Record<string, number[]> = {};

    for (const p of prompts) {
      for (const file of p.fileTargets) {
        if (!fileToSteps[file]) fileToSteps[file] = [];
        fileToSteps[file].push(p.position);
      }
    }

    for (const [file, steps] of Object.entries(fileToSteps)) {
      if (steps.length > 1) {
        conflicts.push(`Multiple steps target '${file}': Steps [${steps.join(', ')}]. Sequential builds might override each other if not carefully merged.`);
      }
    }

    return conflicts;
  }
}
