export interface HealingDiagnosis {
  errorSummary: string;
  remedialStrategy: string;
  autoHealed: boolean;
}

export class SelfHealingMiddleware {
  static async executeWithSelfHealing<T>(
    operationName: string,
    operationFn: () => Promise<T>,
    remedyFn?: (error: any) => Promise<T>,
    maxRetries = 2
  ): Promise<T> {
    let attempts = 0;
    
    while (attempts <= maxRetries) {
      try {
        console.log(`[SELF-HEALING] Running ${operationName} (Attempt ${attempts + 1}/${maxRetries + 1})`);
        return await operationFn();
      } catch (error: any) {
        attempts++;
        console.error(`[SELF-HEALING CRASH] Operation "${operationName}" failed with error:`, error.message);
        
        // Analyze log and compile diagnosis
        const diagnosis = this.analyzeLogsAndDiagnose(error);
        console.log(`[SELF-HEALING DIAGNOSIS] Error: "${diagnosis.errorSummary}". Plan: ${diagnosis.remedialStrategy}`);
        
        if (attempts > maxRetries) {
          console.error(`[SELF-HEALING FAILED] Maximum retries reached for ${operationName}. Aborting.`);
          throw new Error(`Self-healing wrapper failed to recover ${operationName}: ${error.message}`);
        }

        // Trigger corrective loop
        if (remedyFn) {
          try {
            console.log(`[SELF-HEALING AUTO-CORRECTION] Invoking remedy function for re-prompting / correction...`);
            return await remedyFn(error);
          } catch (remedyError: any) {
            console.error(`[SELF-HEALING REMEDY CRASH] Remedy attempt failed:`, remedyError.message);
          }
        }
      }
    }
    throw new Error(`Self-healing execution failed: Unknown error`);
  }

  private static analyzeLogsAndDiagnose(error: any): HealingDiagnosis {
    const message = error.message || "";
    
    if (message.includes("ENOENT") || message.includes("not found")) {
      return {
        errorSummary: "Missing Dependency or File Path Typo",
        remedialStrategy: "Verify exact file paths or trigger automated package installation checks.",
        autoHealed: true
      };
    }
    
    if (message.includes("SyntaxError") || message.includes("Unexpected token")) {
      return {
        errorSummary: "Syntax Break / AST Compilation Error",
        remedialStrategy: "Deconstruct modified code lines, examine brace closures, and perform surgical line-by-line repairs.",
        autoHealed: true
      };
    }

    if (message.includes("PINECONE_API_KEY")) {
      return {
        errorSummary: "Environment Variable Missing / Bad Secret Integration",
        remedialStrategy: "Inject fallback mock values or safely alert system dashboard for credential verification.",
        autoHealed: true
      };
    }

    return {
      errorSummary: "General Runtime Exception",
      remedialStrategy: "Re-prompt underlying specialist agent with exact stack trace for automated AST refactoring.",
      autoHealed: false
    };
  }
}
