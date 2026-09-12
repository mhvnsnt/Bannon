import express from 'express';

/**
 * genRouter — BANNON asset generation routes for the God Mode OS daemon.
 * Mount with:  app.use('/api', genRouter)   ->  /api/ai/expand, /api/gen/image, /api/gen/video
 * Matches the MODEL FORGE front end (AI_ASSIST_URL, IMAGE_GEN_URL) exactly.
 */
const router = express.Router();

const OLLAMA_BASE = process.env.OLLAMA_BASE || 'http://localhost:11434/v1';
const OLLAMA_MODEL = process.env.AI_ASSIST_MODEL || 'qwen3-abliterated';   // the abliterated GGUF you pull into Ollama
const FLUX_URL = process.env.FLUX_URL || '';        // your FLUX/SDXL server (ComfyUI/diffusers) or Replicate proxy
const SUPA_URL = process.env.SUPABASE_URL || '';
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// ---- AI-ASSIST: expand a rough idea into a clean generation prompt (Qwen abliterated via Ollama) ----
router.post('/ai/expand', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  try {
    const r = await fetch(`${OLLAMA_BASE}/chat/completions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL, temperature: 0.8,
        messages: [
          { role: 'system', content: 'You expand a short idea into ONE vivid asset-generation prompt for image/3D models. Concrete visual detail, materials, lighting, T-pose or isolated framing where relevant. Output only the prompt, no preamble.' },
          { role: 'user', content: prompt },
        ],
      }),
    });
    const j: any = await r.json();
    const text = j?.choices?.[0]?.message?.content?.trim();
    res.json({ text: text || prompt });
  } catch (e: any) {
    res.status(502).json({ error: 'ollama unreachable: ' + e.message });
  }
});

// ---- IMAGE GEN: FLUX/SDXL for textures/tattoos/logos/banners/arena. Proxies FLUX_URL, else queues to Supabase.
router.post('/gen/image', async (req, res) => {
  const { prompt, category, images } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  if (FLUX_URL) {
    try {
      const r = await fetch(FLUX_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, category, images }) });
      const j: any = await r.json();
      return res.json({ url: j.url || j.imageUrl, category });
    } catch (e: any) { return res.status(502).json({ error: 'flux server: ' + e.message }); }
  }
  // fallback: queue a job the Colab FLUX cell fills (same pattern as 3D gen_jobs)
  return queueJob(res, { prompt, category: category || 'image', kind: 'image', images });
});

// ---- VIDEO GEN: titantrons / cutscenes (Wan2.x / LTX-Video). Batch queue — the notebook renders it.
router.post('/gen/video', async (req, res) => {
  const { prompt, seconds } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  return queueJob(res, { prompt, kind: 'video', seconds: seconds || 5 });
});

// ---- shared job status (image + video batch) ----
router.get('/gen/job/:id', async (req, res) => {
  if (!SUPA_URL) return res.status(503).json({ error: 'no supabase configured' });
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/gen_jobs?id=eq.${req.params.id}&select=*`, { headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY } });
    const rows: any = await r.json();
    const row = rows?.[0];
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json({ id: row.id, status: row.status, progress: row.progress, url: row.glb_url, error: row.error });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

async function queueJob(res: express.Response, payload: any) {
  if (!SUPA_URL) return res.status(503).json({ error: 'no image/video backend set (FLUX_URL) and no Supabase queue configured' });
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/gen_jobs`, {
      method: 'POST', headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ prompt: payload.prompt, character_key: payload.kind, status: 'queued', progress: 0 }),
    });
    const rows: any = await r.json();
    res.json({ id: rows?.[0]?.id, queued: true, kind: payload.kind });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}

export default router;
