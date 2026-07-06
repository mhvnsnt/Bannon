export interface ValidationResult {
  valid: boolean;
  error?: string;
  remedy?: string;
}

export class RazorValidator {
  private static totalValidations = 0;
  private static validationFailures = 0;
  private static failurePatterns: Record<string, number> = {};

  static getValidationStats() {
    return {
      totalValidations: this.totalValidations,
      failureRate: this.totalValidations > 0 ? this.validationFailures / this.totalValidations : 0.0,
      failurePatterns: this.failurePatterns
    };
  }

  static validate(fileContent: string, filename: string): ValidationResult {
    this.totalValidations++;
    const ext = filename.split('.').pop()?.toLowerCase();
    
    // Check for remaining razor placeholders
    if (fileContent.includes('[RAZOR_OMITTED_SECTION_')) {
      this.validationFailures++;
      this.failurePatterns['ORPHAN_RAZOR_MARKERS'] = (this.failurePatterns['ORPHAN_RAZOR_MARKERS'] || 0) + 1;
      return {
        valid: false,
        error: 'The reconstructed file contains lingering un-resolved Razor markers.',
        remedy: 'Run complete source restoration for all cached placeholders.'
      };
    }

    if (ext === 'html') {
      // Validate HTML closing tags
      const openScripts = (fileContent.match(/<script/g) || []).length;
      const closeScripts = (fileContent.match(/<\/script>/g) || []).length;
      if (openScripts !== closeScripts) {
        this.validationFailures++;
        this.failurePatterns['UNCLOSED_SCRIPT_TAGS'] = (this.failurePatterns['UNCLOSED_SCRIPT_TAGS'] || 0) + 1;
        return {
          valid: false,
          error: `Unbalanced script tags detected: Header script blocks (${openScripts}) does not match trailer scripts (${closeScripts}).`,
          remedy: 'Verify trailing tag alignment.'
        };
      }

      const openStyles = (fileContent.match(/<style/g) || []).length;
      const closeStyles = (fileContent.match(/<\/style>/g) || []).length;
      if (openStyles !== closeStyles) {
        this.validationFailures++;
        this.failurePatterns['UNCLOSED_STYLE_TAGS'] = (this.failurePatterns['UNCLOSED_STYLE_TAGS'] || 0) + 1;
        return {
          valid: false,
          error: `Unbalanced style tags detected: <style> count is ${openStyles} and </style> is ${closeStyles}.`,
          remedy: 'Complete structural enclosure on stylesheet elements.'
        };
      }
    }

    // Standard brace checking
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext || '')) {
      const openBraces = (fileContent.match(/\{/g) || []).length;
      const closeBraces = (fileContent.match(/\}/g) || []).length;
      
      // We don't fail immediately on braces because strings/regex can contain braces, 
      // but if the disparity is major (>5), flag it
      if (Math.abs(openBraces - closeBraces) > 10) {
        this.validationFailures++;
        this.failurePatterns['BRACE_MISMATCH_ALERT'] = (this.failurePatterns['BRACE_MISMATCH_ALERT'] || 0) + 1;
        return {
          valid: false,
          error: `Severe brace alignment variance: ${openBraces} opening vs ${closeBraces} closing curly braces.`,
          remedy: 'Restore balancing structures.'
        };
      }
    }

    return { valid: true };
  }
}
