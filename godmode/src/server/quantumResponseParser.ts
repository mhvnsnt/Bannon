export interface ParsedQuantumResponse {
  analysis: string;
  diff: string;
  fullFile: string;
  previewReady: boolean;
  changeSummary: string;
  parseSuccess: boolean;
}

export class QuantumResponseParser {
  static parse(text: string): ParsedQuantumResponse {
    const extractTag = (tag: string): string => {
      const openTag = `<${tag}>`;
      const closeTag = `</${tag}>`;
      
      const startIdx = text.indexOf(openTag);
      if (startIdx === -1) return '';
      
      const endIdx = text.indexOf(closeTag, startIdx + openTag.length);
      if (endIdx === -1) {
        // Fallback: search-to-end or next tag
        return text.slice(startIdx + openTag.length).trim();
      }
      
      return text.slice(startIdx + openTag.length, endIdx).trim();
    };

    const analysis = extractTag('ANALYSIS');
    const diff = extractTag('DIFF');
    const fullFile = extractTag('FULL_FILE');
    const previewVal = extractTag('PREVIEW_READY').toLowerCase();
    const changeSummary = extractTag('CHANGE_SUMMARY') || 'Quantum auto edit';

    const previewReady = previewVal.includes('true') || previewVal.includes('yes');
    
    const hasCode = diff.length > 0 || fullFile.length > 0;
    const parseSuccess = hasCode || analysis.length > 0;

    return {
      analysis,
      diff,
      fullFile,
      previewReady,
      changeSummary,
      parseSuccess
    };
  }
}
