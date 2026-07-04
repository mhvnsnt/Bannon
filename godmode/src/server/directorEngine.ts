import { GoogleGenAI } from '@google/genai';
import { PromptQueueEngine } from './promptQueueEngine';
import { nexusBus } from './modelRouter';

export interface DirectorTranslation {
  originalCommand: string;
  technicalTask: string;
  parametersTargeted: string[];
  queueId: string | null;
  timestamp: string;
}

export class DirectorEngine {
  private static aiInstance: GoogleGenAI | null = null;

  public injectIntoPrompt(prompt: string): string {
    console.log('[DirectorEngine] Injecting directorial directives into prompt stream...');
    return prompt + `\n\n[DIRECTOR_INSTRUCTION] Maintain absolute structural integrity and clinical precision.`;
  }

  static getAI(): GoogleGenAI {
    if (!this.aiInstance) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not defined. Director executive channel disconnected.');
      }
      this.aiInstance = new GoogleGenAI({ apiKey });
    }
    return this.aiInstance;
  }

  static async ingestCommand(rawCommand: string): Promise<DirectorTranslation> {
    console.log(`[DirectorEngine] Ingesting vision vector: "${rawCommand}"`);

    const ai = this.getAI();
    
    const systemPrompt = `You are the executive translation spine of the Absolute Autonomy System.
Your job is to translate a vague or high-level human director command about game variables, mechanics, physics, or visuals into a precise, step-by-step technical SwarmTask block that our code-modifying prompt queue engine can directly execute.

CRITICAL PROTOCOLS:
1. Never use the word "sovereign". The absolute truth is autonomous.
2. Maintain strict cinematic clinical physics mapping.
3. Formulate the response as a valid JSON object with the following fields:
   - "technicalTask": a complete, detailed, instruction prompt describing what to edit (which coordinates, variables, HTML/CSS elements, or joint parameters to alter).
   - "parametersTargeted": string array of specific game variables or files targeted (e.g., ["GRAVITY", "STRIKE", "bannon.html"]).

Translate this user vision: "${rawCommand}"`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: systemPrompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || '{}';
      const parsed = JSON.parse(text);

      const technicalTask = parsed.technicalTask || `Surgically modify Bannon physical game variables in bannon.html based on intent: ${rawCommand}`;
      const parametersTargeted = parsed.parametersTargeted || [];

      // Create a formatted code mutation prompt for the prompt library
      const fullPromptText = `${technicalTask}\n\nMake sure to update bannon.html completely with no stubs. Preserve the Bannon strike realism formulas and active ragdoll Joint constraints. Include clinical precision.`;

      // Queue the task via our Queue Engine
      const queueId = await PromptQueueEngine.createQueue([fullPromptText], {
        stopOnFailure: true,
        validationRequired: true,
        autoAdvance: true
      });

      // Execute queue immediately
      PromptQueueEngine.executeQueue(queueId).catch(err => {
        console.error('[DirectorEngine] Scheduled prompt queue failed execution:', err.message);
      });

      const translation: DirectorTranslation = {
        originalCommand: rawCommand,
        technicalTask,
        parametersTargeted,
        queueId,
        timestamp: new Date().toISOString()
      };

      console.log(`[DirectorEngine] Ingestion complete. Queued task block ${queueId}.`);

      // Emit DIRECTOR_COMMAND_ISSUED
      nexusBus.emit('DIRECTOR_COMMAND_ISSUED', translation);

      return translation;

    } catch (err: any) {
      console.error('[DirectorEngine] Executive translation failure:', err.message);
      
      // Stable fallback
      const fallbackTask = `Surgically update bannon.html constants to match user's vision: ${rawCommand}`;
      const queueId = await PromptQueueEngine.createQueue([fallbackTask], {
        stopOnFailure: false,
        validationRequired: false
      });
      
      const translation: DirectorTranslation = {
        originalCommand: rawCommand,
        technicalTask: fallbackTask,
        parametersTargeted: ['BANNON_CONFIG'],
        queueId,
        timestamp: new Date().toISOString()
      };

      nexusBus.emit('DIRECTOR_COMMAND_ISSUED', translation);
      return translation;
    }
  }
}
