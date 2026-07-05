import { GoogleGenAI } from '@google/genai';
import { LocalInferenceEngine } from '../quantum/LocalInferenceEngine';

export class ModelRouter {
    private static ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "mock-key" });
    private static useLocalInference = process.env.USE_LOCAL_INFERENCE === 'true';

    static setInferenceMode(useLocal: boolean) {
        this.useLocalInference = useLocal;
        console.log(`[ModelRouter] Inference mode set to: ${useLocal ? 'LOCAL_OLLAMA' : 'CLOUD_GEMINI'}`);
    }

    static async generateCompletion(prompt: string, model: string = "gemini-2.5-pro"): Promise<string> {
        if (this.useLocalInference) {
            // Route to free local model
            return await LocalInferenceEngine.inferLocally(prompt, "deepseek-coder");
        } else {
            // Route to cloud Gemini API
            try {
                const response = await this.ai.models.generateContent({
                    model: model,
                    contents: prompt
                });
                return response.text || "";
            } catch (error: any) {
                console.error("[ModelRouter] Gemini API failed, falling back to Local Inference...", error.message);
                return await LocalInferenceEngine.inferLocally(prompt, "deepseek-coder");
            }
        }
    }
}
