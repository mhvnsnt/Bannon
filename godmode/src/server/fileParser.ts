import { memoryVault } from './db';
import crypto from 'crypto';

export interface FileSection {
  sectionType: string;
  name: string;
  startLine: number;
  endLine: number;
  tokenCount: number;
  dependencies: string[];
  dependents: string[];
  metaphysical_content?: boolean;
}

export interface FileStructureMap {
  checksum: string;
  sections: FileSection[];
}

export class FileParser {
  static parseStructure(fileContent: string, filename: string): FileStructureMap {
    const checksum = crypto.createHash('md5').update(fileContent).digest('hex');
    
    // Check SQLite cache first
    try {
      const cached = memoryVault.prepare(`SELECT structure_map FROM file_structure_cache WHERE checksum = ?`).get(checksum) as any;
      if (cached) {
        return {
          checksum,
          sections: JSON.parse(cached.structure_map)
        };
      }
    } catch (e) {
      console.warn('[FileParser] Cache fetch failed. Proceeding with cold parse.', e);
    }

    const ext = filename.split('.').pop()?.toLowerCase() || 'ts';
    const lines = fileContent.split('\n');
    const sections: FileSection[] = [];

    // Parse logic matches extension
    if (ext === 'html') {
      this.parseHTML(lines, sections);
    } else if (['jsx', 'tsx', 'ts', 'js'].includes(ext)) {
      this.parseScript(lines, sections);
    } else {
      // Default single section to avoid parser failure
      sections.push({
        sectionType: 'generic',
        name: 'full_body',
        startLine: 1,
        endLine: lines.length,
        tokenCount: Math.ceil(fileContent.length / 4),
        dependencies: [],
        dependents: []
      });
    }

    // Flag astrological & metaphysical sections
    for (const section of sections) {
      const sectionContent = lines.slice(section.startLine - 1, section.endLine).join('\n').toLowerCase();
      if (
        sectionContent.includes('astrology') || 
        sectionContent.includes('numerology') || 
        sectionContent.includes('bazi') || 
        sectionContent.includes('tarot') ||
        sectionContent.includes('life path') ||
        sectionContent.includes('soul urge') ||
        sectionContent.includes('nine protocol')
      ) {
        section.metaphysical_content = true;
      }
    }

    // Cache structure map inside sqlite
    try {
      memoryVault.prepare(`
        INSERT OR REPLACE INTO file_structure_cache (checksum, structure_map)
        VALUES (?, ?)
      `).run(checksum, JSON.stringify(sections));
    } catch (err: any) {
      console.warn('[FileParser] Saving cache structure failed:', err.message);
    }

    return { checksum, sections };
  }

  private static parseHTML(lines: string[], sections: FileSection[]) {
    let currentSectionStart = 1;
    let isInsideScript = false;
    let scriptBlockId = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      if (line.includes('<script')) {
        // Save markup leading up to script block
        if (lineNum - 1 >= currentSectionStart) {
          sections.push({
            sectionType: 'markup',
            name: `markup_block_${currentSectionStart}_to_${lineNum-1}`,
            startLine: currentSectionStart,
            endLine: lineNum - 1,
            tokenCount: Math.ceil(lines.slice(currentSectionStart - 1, lineNum - 1).join('\n').length / 4),
            dependencies: [],
            dependents: []
          });
        }
        currentSectionStart = lineNum;
        isInsideScript = true;
      } else if (line.includes('</script>')) {
        // Save JS section
        sections.push({
          sectionType: 'javascript',
          name: `script_block_${scriptBlockId++}`,
          startLine: currentSectionStart,
          endLine: lineNum,
          tokenCount: Math.ceil(lines.slice(currentSectionStart - 1, lineNum).join('\n').length / 4),
          dependencies: [],
          dependents: []
        });
        currentSectionStart = lineNum + 1;
        isInsideScript = false;
      }
    }

    // Flush trailing markup block
    if (currentSectionStart <= lines.length) {
      sections.push({
        sectionType: 'markup',
        name: `markup_tail`,
        startLine: currentSectionStart,
        endLine: lines.length,
        tokenCount: Math.ceil(lines.slice(currentSectionStart - 1).join('\n').length / 4),
        dependencies: [],
        dependents: []
      });
    }
  }

  private static parseScript(lines: string[], sections: FileSection[]) {
    // Basic heuristics to group script imports and export functions
    let currentStart = 1;
    let index = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      const isBoundary = 
        line.trim().startsWith('import ') ||
        line.trim().startsWith('export function') || 
        line.trim().startsWith('export const') ||
        line.trim().startsWith('class ') ||
        line.trim().startsWith('function ') ||
        (line.startsWith('const ') && line.includes('=>'));

      if (isBoundary && lineNum > 1 && lineNum - 1 >= currentStart) {
        sections.push({
          sectionType: 'code-block',
          name: `section_${index++}`,
          startLine: currentStart,
          endLine: lineNum - 1,
          tokenCount: Math.ceil(lines.slice(currentStart - 1, lineNum - 1).join('\n').length / 4),
          dependencies: [],
          dependents: []
        });
        currentStart = lineNum;
      }
    }

    if (currentStart <= lines.length) {
      sections.push({
        sectionType: 'code-block',
        name: `section_tail`,
        startLine: currentStart,
        endLine: lines.length,
        tokenCount: Math.ceil(lines.slice(currentStart - 1).join('\n').length / 4),
        dependencies: [],
        dependents: []
      });
    }
  }

  static getSectionContent(fileContent: string, section: FileSection): string {
    const lines = fileContent.split('\n');
    return lines.slice(section.startLine - 1, section.endLine).join('\n');
  }

  static injectAtSection(fileContent: string, section: FileSection, newContent: string, position: 'BEFORE' | 'AFTER' | 'REPLACE'): string {
    const lines = fileContent.split('\n');
    const before = lines.slice(0, section.startLine - 1).join('\n');
    const target = lines.slice(section.startLine - 1, section.endLine).join('\n');
    const after = lines.slice(section.endLine).join('\n');

    if (position === 'REPLACE') {
      return (before + '\n' + newContent + '\n' + after).trim();
    } else if (position === 'BEFORE') {
      return (before + '\n' + newContent + '\n' + target + '\n' + after).trim();
    } else {
      return (before + '\n' + target + '\n' + newContent + '\n' + after).trim();
    }
  }
}
