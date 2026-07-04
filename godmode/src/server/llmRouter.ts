import express from "express";
import axios from "axios";

const router = express.Router();
const OLLAMA_BASE = process.env.OLLAMA_BASE || 'http://localhost:11434/v1';

router.post("/chat", async (req, res) => {
  try {
    const modelId = req.body.model;
    let baseURL = OLLAMA_BASE;
    let apiKey = 'none';
    let modelName = modelId;

    if (modelId === 'qwable-3.6-27b') {
      baseURL = process.env.QUABLE_API_URL || 'http://127.0.0.1:8081/v1'; // Out of the way of your port tunnel
      apiKey = 'none';
      modelName = 'huihui-ai/Huihui-Qwable-3.6-27b-abliterated-GGUF';
    }

    const payload = { ...req.body, model: modelName };
    const response = await axios.post(`${baseURL}/chat/completions`, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (err: any) {
    console.error('[NEXUS LLM] Router Error:', err.message);
    res.status(500).json({ error: 'LLM Proxy Failed', details: err.message });
  }
});

export default router;
