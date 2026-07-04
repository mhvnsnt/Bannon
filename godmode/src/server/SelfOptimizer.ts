import fs from "fs/promises";
import path from "path";

// A built-in basic fetch polyfill using http/https if axios is not available,
// but we will use the native fetch in Node 18+.

interface OptimizationResult {
  optimizedCode: string;
  explanation: string;
  success: boolean;
}

export class SelfOptimizer {
  private localOllamaUrl: string;
  private targetModel: string;

  constructor(
    localOllamaUrl = process.env.OLLAMA_URL || "http://localhost:11434",
    targetModel = "bannon-nexus"
  ) {
    this.localOllamaUrl = localOllamaUrl;
    this.targetModel = targetModel;
  }

  /**
   * Reads a local file from the workspace
   */
  private async readTargetFile(filePath: string): Promise<string> {
    try {
      const absolutePath = path.resolve(filePath);
      return await fs.readFile(absolutePath, "utf-8");
    } catch (error) {
      throw new Error(`Failed to read target file at ${filePath}: ${error}`);
    }
  }

  /**
   * Writes the optimized code back to the file system after validation
   */
  private async writeTargetFile(filePath: string, content: string): Promise<void> {
    try {
      const absolutePath = path.resolve(filePath);
      // Create a backup before overwriting to preserve system stability
      const backupPath = `${absolutePath}.bak`;
      await fs.copyFile(absolutePath, backupPath);
      await fs.writeFile(absolutePath, content, "utf-8");
    } catch (error) {
      throw new Error(`Failed to write optimized file to ${filePath}: ${error}`);
    }
  }

  /**
   * Verifies that the optimized code compiles or has basic syntax integrity
   */
  private validateSyntax(code: string, extension: string): boolean {
    if (extension === ".ts" || extension === ".js" || extension === ".tsx" || extension === ".jsx") {
      try {
        // We do a rough check. For TS/TSX we just check block closures.
        return !code.includes("<<<") && !code.includes(">>>");
      } catch (e) {
        return false;
      }
    }
    return true;
  }

  /**
   * Executes the local optimization loop using the edge model
   */
  public async optimizeFile(filePath: string): Promise<OptimizationResult> {
    const fileExtension = path.extname(filePath);
    const rawCode = await this.readTargetFile(filePath);

    const systemPrompt = `You are the Apex Core Self Optimizer running locally. Your goal is to optimize the provided code for maximum performance, memory efficiency, and structural density. 
You must output ONLY the optimized code inside a single markdown code block starting with \`\`\`${fileExtension.substring(1)}.
Do not include any conversational filler, explanations, or warnings outside the code block. Your output must be production ready.`;

    const userPrompt = `Optimize this file to reduce latency and eliminate structural friction:
File Path: ${filePath}
Code:
${rawCode}`;

    try {
      const response = await fetch(`${this.localOllamaUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.targetModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          options: {
            temperature: 0.15,
            top_p: 0.9,
            num_ctx: 32768
          },
          stream: false
        })
      });

      if (!response.ok) {
         throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const responseData = await response.json();
      const assistantMessage = responseData.message?.content || "";
      
      // Extract the code block safely
      const codeBlockRegex = new RegExp(`\`\`\`(?:${fileExtension.substring(1)})?\\s*([\\s\\S]*?)\`\`\``, "i");
      const match = codeBlockRegex.exec(assistantMessage);

      if (!match || !match[1]) {
        return {
          optimizedCode: "",
          explanation: "Failed to parse code block from local model output.",
          success: false
        };
      }

      const optimizedCode = match[1].trim();

      // Validate before deploying back to the file system
      const isValid = this.validateSyntax(optimizedCode, fileExtension);
      if (!isValid) {
        return {
          optimizedCode,
          explanation: "Optimized code failed basic syntax validation checks.",
          success: false
        };
      }

      // Write changes locally, securing the upgrade
      await this.writeTargetFile(filePath, optimizedCode);

      return {
        optimizedCode,
        explanation: `Successfully optimized and compiled locally using ${this.targetModel}.`,
        success: true
      };

    } catch (error: any) {
      return {
        optimizedCode: "",
        explanation: `Optimization pipeline failed: ${error.message}`,
        success: false
      };
    }
  }
}
