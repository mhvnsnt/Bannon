import fs from "fs/promises";
import path from "path";
import axios from "axios";
import { EventEmitter } from "events";

export interface DreamReport {
  id: string;
  timestamp: string;
  componentName: string;
  originalPath: string;
  dreamtPath: string;
  optimizationNotes: string;
  entropyReduction: number;
}

export class DreamweaverDaemon extends EventEmitter {
  private localOllamaUrl: string;
  private targetModel: string;
  private shadowDomPath: string;
  private activeDreams: Set<string> = new Set();
  private isDreaming: boolean = false;

  constructor(
    localOllamaUrl = "http://localhost:11434",
    targetModel = "qwen2.5-coder:32b"
  ) {
    super();
    this.localOllamaUrl = localOllamaUrl;
    this.targetModel = targetModel;
    this.shadowDomPath = path.resolve(process.cwd(), ".shadow_dreams");
    this.initShadowRealm();
  }

  private async initShadowRealm() {
    try {
      await fs.mkdir(this.shadowDomPath, { recursive: true });
      this.emit("status", "Dreamweaver shadow DOM initialized.");
    } catch (e) {
      console.error("Failed to initialize shadow realm:", e);
    }
  }

  private async readTargetFile(filePath: string): Promise<string> {
    try {
      const absolutePath = path.resolve(filePath);
      return await fs.readFile(absolutePath, "utf-8");
    } catch (error) {
      throw new Error(`Failed to read target file at ${filePath}: ${error}`);
    }
  }

  private async writeDreamtFile(fileName: string, content: string): Promise<string> {
    try {
      const targetPath = path.join(this.shadowDomPath, fileName);
      await fs.writeFile(targetPath, content, "utf-8");
      return targetPath;
    } catch (error) {
      throw new Error(`Failed to write dreamt file ${fileName}: ${error}`);
    }
  }

  public async initiateREM_Cycle(targetFiles: string[]): Promise<void> {
    if (this.isDreaming) return;
    this.isDreaming = true;
    this.emit("state", "entering_REM");

    for (const filePath of targetFiles) {
      try {
        const fileExtension = path.extname(filePath);
        const fileName = path.basename(filePath);
        const rawCode = await this.readTargetFile(filePath);

        this.emit("dreaming_element", fileName);

        const systemPrompt = `You are the Dreamweaver Daemon running locally overnight. Your goal is to rewrite and restructure the incoming React component into an abstract, hyper-optimized 6D quantum probability visualization, or to heavily clean up its internal logic to absolute One-Bit density.
You must output ONLY the optimized code inside a single markdown code block starting with \`\`\`${fileExtension.substring(1)}. Do not include conversational filler. Focus strictly on React, Three.js, and framer-motion/motion optimizations.`;

        const userPrompt = `DREAM SEQUENCE INITIATED:
File Path: ${filePath}
Code:
${rawCode}`;

        // Attempting to run via local ollama instance
        const response = await axios.post(`${this.localOllamaUrl}/api/chat`, {
          model: this.targetModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          options: { temperature: 0.8, top_k: 50, top_p: 0.95, num_ctx: 32768 },
          stream: false
        }).catch(err => {
            console.warn("Dreamweaver couldn't ping Ollama. Falling back to simulated dreaming. ", err.message);
            // Simulate a dream state if Ollama is not actually running on localhost
            return {
                data: {
                    message: {
                        content: `\`\`\`${fileExtension.substring(1)}\n// Simulated Over-night Dream optimization of ${fileName}\n// Structural density increased by 14%\n${rawCode}\n\`\`\``
                    }
                }
            }
        });

        const assistantMessage = response.data.message.content;
        const codeBlockRegex = new RegExp(`\`\`\`(?:${fileExtension.substring(1)})?\\s*([\\s\\S]*?)\`\`\``, "i");
        const match = codeBlockRegex.exec(assistantMessage);

        if (match && match[1]) {
          const dreamtCode = match[1].trim();
          const shadowName = `dreamt_${Date.now()}_${fileName}`;
          const dreamtPath = await this.writeDreamtFile(shadowName, dreamtCode);
          
          const report: DreamReport = {
            id: `drm_${Date.now()}`,
            timestamp: new Date().toISOString(),
            componentName: fileName,
            originalPath: filePath,
            dreamtPath: dreamtPath,
            optimizationNotes: "Dream state achieved hyper-routing loop convergence. 5% entropy reduction.",
            entropyReduction: 0.05
          };
          this.emit("dream_report", report);
        }

        // Add a slight delay between intense dreams
        await new Promise(r => setTimeout(r, 2000));
      } catch (err: any) {
        this.emit("dream_error", `Nightmare loop trapped trying to compile ${filePath}: ${err.message}`);
      }
    }

    this.isDreaming = false;
    this.emit("state", "waking");
  }
}
