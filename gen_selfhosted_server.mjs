/* ============================================================================
 * gen_selfhosted_server.mjs — BANNON free model-gen backend (OWN_GEN_URL target)
 *
 * Implements the exact contract CharacterModelGen.ts runSelf() already calls:
 *   POST  /            { prompt, rig, characterId, image }  -> { id }        (async)
 *   GET   /:id                                              -> { status, progress, glbUrl, error }
 * Optional Bearer auth via OWN_GEN_KEY (matches runSelf's Authorization header).
 *
 * It does NOT run the GPU model itself — it's the coordination layer. Flow:
 *   in-game prompt -> daemon (self provider) -> POST here -> row in Supabase `gen_jobs` (queued)
 *   your Colab/Kaggle Hunyuan3D notebook polls `gen_jobs`, generates the .glb, uploads to Supabase
 *   Storage, PATCHes the row to succeeded+glb_url -> GET /:id returns it -> loadFighterModel fires.
 *
 * Deploy on Railway (or anywhere Node runs) and set OWN_GEN_URL to its public URL on the daemon.
 *
 * Env:
 *   SUPABASE_URL           https://<project>.supabase.co
 *   SUPABASE_SERVICE_KEY   service_role key (server-side only, never ship to the client)
 *   OWN_GEN_KEY            (optional) shared secret; if set, requests must send it as Bearer
 *   PORT                   (optional) default 8787
 *
 * Deps:  npm i express @supabase/supabase-js
 * ============================================================================ */
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  OWN_GEN_KEY,
  PORT = 8787,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('[gen] missing SUPABASE_URL / SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const app = express();
app.use(express.json({ limit: '12mb' })); // image field can be a base64 data URL

// permissive CORS (the daemon calls server-to-server; browsers may call the status route directly)
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// optional shared-secret gate (matches runSelf's Bearer OWN_GEN_KEY)
function authed(req) {
  if (!OWN_GEN_KEY) return true;
  const h = req.get('authorization') || '';
  return h === `Bearer ${OWN_GEN_KEY}`;
}

// map a gen_jobs row to the shape runSelf expects
function jobView(row) {
  return {
    id: row.id,
    status: row.status,                 // queued | running | succeeded | failed
    progress: row.progress ?? 0,
    glbUrl: row.glb_url || undefined,
    error: row.error || undefined,
    characterId: row.character_key || undefined,
  };
}

// health / info
app.get('/health', (_req, res) => res.json({ ok: true, service: 'bannon-gen-selfhosted' }));

// POST /  -> queue a job, return { id }
app.post('/', async (req, res) => {
  if (!authed(req)) return res.status(401).json({ error: 'unauthorized' });
  const { prompt, image, characterId } = req.body || {};
  if (!prompt && !image) return res.status(400).json({ error: 'prompt or image required' });
  try {
    const { data, error } = await db.from('gen_jobs').insert({
      prompt: prompt || null,
      image_url: typeof image === 'string' && image.startsWith('http') ? image : null,
      character_key: characterId || null,
      status: 'queued',
      progress: 0,
    }).select('id').single();
    if (error) throw error;
    // If you pass a base64 image (data URL), stash it so the notebook can pull it.
    if (typeof image === 'string' && image.startsWith('data:')) {
      await db.from('gen_jobs').update({ image_url: image.slice(0, 2_000_000) }).eq('id', data.id);
    }
    res.json({ id: data.id });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

// GET /:id -> { status, progress, glbUrl, error }
app.get('/:id', async (req, res) => {
  if (!authed(req)) return res.status(401).json({ error: 'unauthorized' });
  try {
    const { data, error } = await db.from('gen_jobs').select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: 'job not found' });
    res.json(jobView(data));
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.listen(PORT, () => console.log(`[gen] BANNON self-hosted gen backend on :${PORT}`));
