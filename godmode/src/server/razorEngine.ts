import { FileParser, FileSection } from './fileParser';
import { EmbeddingEngine } from './embeddingEngine';

export interface RazorSliceResult {
  slicedContent: string;
  tokensOriginal: number;
  tokensAfterRazor: number;
  reductionPercent: number;
  sectionsKept: string[];
  sectionsRemoved: string[];
  razorMap: Record<string, string>;
}

export class RazorEngine {
  private static totalTokensSaved = 0;
  private static totalSlices = 0;
  private static totalReconstructions = 0;
  private static successfulReconstructions = 0;
  private static strategyUsage: Record<string, number> = {
    'SEMANTIC': 0,
    'DEPENDENCY': 0,
    'SURGICAL': 0,
    'DIFF': 0
  };

  static getRazorStats() {
    return {
      totalSlices: this.totalSlices,
      averageReductionPercent: this.totalSlices > 0 ? Math.round((this.totalTokensSaved / (this.totalTokensSaved + (this.totalSlices * 4000))) * 100) : 0, // estimate stats
      totalTokensSavedAllTime: this.totalTokensSaved,
      strategyUsage: this.strategyUsage,
      reconstructionSuccessRate: this.totalReconstructions > 0 ? this.successfulReconstructions / this.totalReconstructions : 1.0
    };
  }

  static async slice(fileContent: string, filename: string, taskIntent: string, maxTokens = 6000): Promise<RazorSliceResult> {
    this.totalSlices++;
    const structureMap = FileParser.parseStructure(fileContent, filename);
    const tokensOriginal = Math.ceil(fileContent.length / 4);

    if (tokensOriginal <= maxTokens) {
      // No need to slice if already below budget
      return {
        slicedContent: fileContent,
        tokensOriginal,
        tokensAfterRazor: tokensOriginal,
        reductionPercent: 0,
        sectionsKept: structureMap.sections.map(s => s.name),
        sectionsRemoved: [],
        razorMap: {}
      };
    }

    // Auto-select strategy
    const intentLower = taskIntent.toLowerCase();
    let strategy: 'SEMANTIC' | 'DEPENDENCY' | 'SURGICAL' | 'DIFF' = 'DEPENDENCY';

    if (intentLower.includes('add') || intentLower.includes('create')) {
      strategy = 'SURGICAL';
    } else if (intentLower.includes('optimize') || intentLower.includes('refactor') || intentLower.includes('compress')) {
      strategy = 'SEMANTIC';
    } else if (intentLower.includes('fix') || intentLower.includes('debug') || intentLower.includes('modify') || intentLower.includes('patch')) {
      strategy = 'DEPENDENCY';
    } else {
      // Specific function or element matching
      const matchesFunction = structureMap.sections.some(s => intentLower.includes(s.name.toLowerCase()));
      if (matchesFunction) {
        strategy = 'DIFF';
      }
    }

    this.strategyUsage[strategy] = (this.strategyUsage[strategy] || 0) + 1;

    const sectionsKept: string[] = [];
    const sectionsRemoved: string[] = [];
    const razorMap: Record<string, string> = {};

    const ext = filename.split('.').pop()?.toLowerCase() || 'ts';
    const lines = fileContent.split('\n');

    // Scores sections
    const scoredSections = await Promise.all(
      structureMap.sections.map(async (sec) => {
        const content = lines.slice(sec.startLine - 1, sec.endLine).join('\n');
        
        // Critical Rule: Metaphysical/Nine Protocol sections are IMMUTABLE and never sliced or modified
        if (sec.metaphysical_content) {
          return { section: sec, score: 1.0, content };
        }

        let score = 0.5;

        if (strategy === 'SEMANTIC') {
          // Compute similarity
          try {
            const secEmbed = await EmbeddingEngine.embed(content);
            const intentEmbed = await EmbeddingEngine.embed(taskIntent);
            score = EmbeddingEngine.cosineSimilarity(secEmbed, intentEmbed);
          } catch {
            score = 0.5;
          }
        } else if (strategy === 'SURGICAL') {
          // Keeps first (imports/headers) and last (footers) sections, plus global vars
          const isHeader = sec.name.includes('block_1') || sec.name.includes('section_1') || sec.name.includes('import');
          const isTail = sec.name.includes('tail') || sec.name.includes('footer');
          score = (isHeader || isTail) ? 0.9 : 0.2;
        } else if (strategy === 'DEPENDENCY') {
          // Look for keyword mentions
          const words = taskIntent.split(/\s+/).filter(w => w.length > 3);
          let matchCount = 0;
          for (const w of words) {
            if (content.toLowerCase().includes(w.toLowerCase())) matchCount++;
          }
          score = matchCount > 0 ? 0.8 : 0.3;
        } else if (strategy === 'DIFF') {
          // Matches by target name
          const isTarget = intentLower.includes(sec.name.toLowerCase());
          score = isTarget ? 1.0 : 0.1;
        }

        return { section: sec, score, content };
      })
    );

    // Filter within Token limit
    let accumulatedTokens = 0;
    
    // Always keep extremely high score sections, then sort and filter the rest
    const formattedComponents: string[] = [];

    for (const item of scoredSections) {
      const isHeader = item.section.name.includes('block_1') || item.section.name.includes('section_1');
      const isMetaphysical = item.section.metaphysical_content;
      
      const mustKeep = item.score >= 0.65 || isHeader || isMetaphysical;

      if (mustKeep && accumulatedTokens + item.section.tokenCount <= maxTokens) {
        sectionsKept.push(item.section.name);
        accumulatedTokens += item.section.tokenCount;
        formattedComponents.push(item.content);
      } else {
        sectionsRemoved.push(item.section.name);
        const placeholderKey = `[RAZOR_OMITTED_SECTION_${item.section.name.toUpperCase()}]`;
        razorMap[placeholderKey] = item.content;

        const commentBlock = ext === 'html' 
          ? `<!-- ${placeholderKey} -->` 
          : `/* ${placeholderKey} */`;
        
        formattedComponents.push(commentBlock);
        accumulatedTokens += 5; // tiny cost for marker
      }
    }

    const slicedContent = formattedComponents.join('\n');
    const tokensAfterRazor = Math.ceil(slicedContent.length / 4);
    const saved = tokensOriginal - tokensAfterRazor;
    if (saved > 0) this.totalTokensSaved += saved;

    return {
      slicedContent,
      tokensOriginal,
      tokensAfterRazor,
      reductionPercent: Math.round(((tokensOriginal - tokensAfterRazor) / tokensOriginal) * 100),
      sectionsKept,
      sectionsRemoved,
      razorMap
    };
  }

  static reconstruct(slicedContent: string, razorMap: Record<string, string>): string {
    this.totalReconstructions++;
    let outputs = slicedContent;
    let occurrencesResolved = 0;

    for (const [placeholder, originalContent] of Object.entries(razorMap)) {
      // Supports standard placeholder or commented variants (html, css, js)
      const patterns = [
        placeholder,
        `/* ${placeholder} */`,
        `/*${placeholder}*/`,
        `<!-- ${placeholder} -->`,
        `<!--${placeholder}-->`
      ];

      let found = false;
      for (const pattern of patterns) {
        if (outputs.includes(pattern)) {
          outputs = outputs.split(pattern).join(originalContent);
          found = true;
          occurrencesResolved++;
          break;
        }
      }
    }

    if (occurrencesResolved > 0 || Object.keys(razorMap).length === 0) {
      this.successfulReconstructions++;
    }

    return outputs;
  }
}
