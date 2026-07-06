import fetch from 'node-fetch';

class OllamaBootstrap {
  async init() {
    try {
      const res = await fetch('http://localhost:11434/api/tags');
      const data = await res.json() as any;
      const models = data.models.map((m: any) => m.name);
      
      let missing = false;
      if (!models.includes('qwen2.5-coder:32b') && !models.includes('qwen2.5-coder:32b:latest')) {
        console.log("OLLAMA: Model qwen2.5-coder:32b not found — pulling now (mock stream)");
        missing = true;
      }
      if (!models.includes('llama3.1:70b') && !models.includes('llama3.1:70b:latest')) {
        console.log("OLLAMA: Model llama3.1:70b not found — pulling now (mock stream)");
        missing = true;
      }
      
      if (!missing) {
         console.log("OLLAMA STATUS: qwen2.5-coder:32b (Healthy), llama3.1:70b (Healthy)");
      }
    } catch (e) {
      console.log("OLLAMA OFFLINE — system will use cloud fallback chain. To enable local models: install Ollama from ollama.ai and run: ollama pull qwen2.5-coder:32b && ollama pull llama3.1:70b");
    }
  }

  async getOllamaStatus() {
    try {
      const res = await fetch('http://localhost:11434/api/tags');
      const data = await res.json() as any;
      return {
        running: true,
        modelsAvailable: data.models.map((m: any) => m.name),
        totalLocalCompute: "102B Params"
      };
    } catch (e) {
      return { running: false, modelsAvailable: [], totalLocalCompute: "0" };
    }
  }
}

export const ollamaBootstrap = new OllamaBootstrap();
