import { HardwareThrottle } from '../orchestration/HardwareThrottle';

export class LocalInferenceEngine {
  /**
   * Routes inference to a local Ollama or vLLM instance to run inference completely free.
   * Relies on a local bare-metal setup. Guarded by the HardwareThrottle.
   */
  static async inferLocally(prompt: string, model: string = "deepseek-coder"): Promise<string> {
    return HardwareThrottle.enqueueInference(async () => {
      try {
        console.log(`[LOCAL INFERENCE] Routing to local bare-metal node for ${model}...`);
              
        const response = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: model,
            prompt: prompt,
            stream: false
          })
        });

        if (!response.ok) {
            throw new Error(`Local inference failed with status ${response.status}`);
        }

        const data = await response.json();
        return data.response;
      } catch (e: any) {
        console.warn("[LOCAL INFERENCE] Local node not reachable. Ensure Ollama is running on port 11434.");
        return `[SIMULATED LOCAL RESPONSE] Local inference engine offline. Ensure Ollama is bound to 11434. Error: ${e.message}`;
      }
    });
  }
}
