/**
 * CharacterModelGen — "prompt -> unique fighter model".
 *
 * This is the in-game "type a description, get a one-of-one character" pipeline. It proxies an AI
 * 3D generator (Meshy by default, Tripo optional) from the daemon so the API key never touches the
 * client, and returns a RIGGED .glb URL that drops straight into the game's existing GLB import
 * (which binds the skeleton to the fight rig and drives morph targets as CAW sliders).
 *
 * How the upstream services work (text -> rigged 3D), so this is honest about the steps:
 *   1. text -> concept image (their diffusion step)
 *   2. image -> textured mesh via a single-image reconstruction model (LRM / TripoSR lineage)
 *   3. auto-rig: drop a humanoid skeleton + skin weights -> export .glb/.fbx
 * Each step is an async task: submit -> poll until SUCCEEDED -> read the model URL.
 *
 * Keys (set whichever provider you use):
 *   MESHY_API_KEY   (https://www.meshy.ai/api)
 *   TRIPO_API_KEY   (https://platform.tripo3d.ai)
 * No key set => generate() returns a clear "not configured" result instead of throwing, so the
 * daemon stays up and the game just falls back to import-your-own-glb.
 */

export type GenProvider = 'self' | 'meshy' | 'tripo';
export interface GenJob {
  id: string;
  provider: GenProvider;
  characterId?: string;
  prompt: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  progress: number;          // 0..100
  glbUrl?: string;           // the RIGGED model when done
  thumbnailUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

const MESHY_BASE = 'https://api.meshy.ai/openapi';
const TRIPO_BASE = 'https://api.tripo3d.ai/v2/openapi';

export class CharacterModelGen {
  private jobs = new Map<string, GenJob>();

  constructor() {
    const has = (k: string) => !!process.env[k];
    console.log(`[Node 13] Character Model Gen — self:${has('OWN_GEN_URL')} meshy:${has('MESHY_API_KEY')} tripo:${has('TRIPO_API_KEY')}`);
  }

  public configured(): { self: boolean; meshy: boolean; tripo: boolean } {
    return { self: !!process.env.OWN_GEN_URL, meshy: !!process.env.MESHY_API_KEY, tripo: !!process.env.TRIPO_API_KEY };
  }

  public getJob(id: string): GenJob | null {
    return this.jobs.get(id) || null;
  }

  public listJobs(): GenJob[] {
    return [...this.jobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /**
   * Kick off a generation. Returns immediately with a queued job; the actual provider work runs in
   * the background and updates the job (poll it via getJob / the /status route). characterId, if
   * given, is just carried through so the client can auto-bind the result to that character.
   */
  public start(prompt: string, opts: { provider?: GenProvider; characterId?: string; rig?: boolean } = {}): GenJob {
    // Prefer OUR OWN backend when configured, so it's the BANNON forge by default — not a 3rd party.
    const provider: GenProvider = opts.provider ||
      (process.env.OWN_GEN_URL ? 'self' : (process.env.MESHY_API_KEY ? 'meshy' : 'tripo'));
    const now = new Date().toISOString();
    const job: GenJob = {
      id: 'gen_' + Math.random().toString(36).slice(2, 10),
      provider, characterId: opts.characterId, prompt,
      status: 'queued', progress: 0, createdAt: now, updatedAt: now,
    };
    this.jobs.set(job.id, job);

    const keyName = provider === 'self' ? 'OWN_GEN_URL' : (provider === 'meshy' ? 'MESHY_API_KEY' : 'TRIPO_API_KEY');
    if (!process.env[keyName]) {
      job.status = 'failed';
      job.error = `${provider} not configured — set ${keyName} on the daemon to enable in-game generation.`;
      job.updatedAt = new Date().toISOString();
      return job;
    }

    // run the pipeline without blocking the request
    const runner = provider === 'self' ? this.runSelf(job, opts.rig !== false)
      : provider === 'meshy' ? this.runMeshy(job, opts.rig !== false)
      : this.runTripo(job, opts.rig !== false);
    runner.catch((e: any) => { this.fail(job, e?.message || String(e)); });
    return job;
  }

  private touch(job: GenJob, patch: Partial<GenJob>) {
    Object.assign(job, patch, { updatedAt: new Date().toISOString() });
  }
  private fail(job: GenJob, error: string) { this.touch(job, { status: 'failed', error }); }

  private async poll<T>(fn: () => Promise<{ done: boolean; progress?: number; value?: T; failed?: boolean; error?: string }>,
                        job: GenJob, label: string, base = 0, span = 100): Promise<T> {
    // generous: these models take ~10s–2min. Poll every 4s up to ~6 min.
    for (let i = 0; i < 90; i++) {
      const r = await fn();
      if (r.failed) throw new Error(`${label} failed: ${r.error || 'unknown'}`);
      if (typeof r.progress === 'number') this.touch(job, { progress: Math.round(base + (r.progress / 100) * span) });
      if (r.done) return r.value as T;
      await new Promise(res => setTimeout(res, 4000));
    }
    throw new Error(`${label} timed out`);
  }

  // ---- OUR OWN backend: a generic adapter to a GPU endpoint WE control (a TRELLIS/Hunyuan + UniRig
  // server, or an HF Space wrapper). Contract is deliberately simple so any host fits:
  //   POST OWN_GEN_URL  { prompt, rig }                -> { glbUrl }  (synchronous), OR
  //                                                    -> { id }      (async)
  //   GET  OWN_GEN_URL + '/' + id                       -> { status:'running'|'succeeded'|'failed',
  //                                                          progress, glbUrl, error }
  // OWN_GEN_KEY (optional) is sent as a Bearer token. This is the "BANNON forge" hook: stand up the
  // model anywhere with this contract and the in-game prompt flow runs entirely on our own stack. ----
  private async runSelf(job: GenJob, rig: boolean) {
    const url = process.env.OWN_GEN_URL!.replace(/\/$/, '');
    const H: Record<string, string> = { 'Content-Type': 'application/json' };
    if (process.env.OWN_GEN_KEY) H['Authorization'] = `Bearer ${process.env.OWN_GEN_KEY}`;
    this.touch(job, { status: 'running', progress: 2 });

    const sub = await fetch(url, {
      method: 'POST', headers: H,
      body: JSON.stringify({ prompt: job.prompt, rig, characterId: job.characterId }),
    }).then(r => r.json() as any);

    // synchronous host: a glb came straight back
    let glb = sub?.glbUrl || sub?.glb || sub?.model_url;
    if (glb) { this.touch(job, { status: 'succeeded', progress: 100, glbUrl: glb, thumbnailUrl: sub?.thumbnailUrl }); return; }

    // async host: poll the job
    const id = sub?.id || sub?.task_id;
    if (!id) throw new Error('own backend returned neither glbUrl nor job id: ' + JSON.stringify(sub).slice(0, 200));
    const done = await this.poll(async () => {
      const s = await fetch(`${url}/${encodeURIComponent(id)}`, { headers: H }).then(r => r.json() as any);
      const st = (s?.status || '').toLowerCase();
      return { done: st === 'succeeded' || st === 'success' || !!s?.glbUrl, failed: st === 'failed' || st === 'error', progress: s?.progress, value: s, error: s?.error };
    }, job, 'own backend', 2, 98) as any;
    glb = done?.glbUrl || done?.glb || done?.model_url;
    if (!glb) throw new Error('own backend finished without a glb');
    this.touch(job, { status: 'succeeded', progress: 100, glbUrl: glb, thumbnailUrl: done?.thumbnailUrl });
  }

  // ---- Meshy: text-to-3d (preview -> refine) then auto-rig ----
  private async runMeshy(job: GenJob, rig: boolean) {
    const key = process.env.MESHY_API_KEY!;
    const H = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
    this.touch(job, { status: 'running', progress: 2 });

    // 1) preview mesh from text
    const prev = await fetch(`${MESHY_BASE}/v2/text-to-3d`, {
      method: 'POST', headers: H,
      body: JSON.stringify({ mode: 'preview', prompt: job.prompt, art_style: 'realistic', should_remesh: true }),
    }).then(r => r.json() as any);
    const previewId = prev?.result;
    if (!previewId) throw new Error('meshy preview submit failed: ' + JSON.stringify(prev));

    await this.poll(async () => {
      const s = await fetch(`${MESHY_BASE}/v2/text-to-3d/${previewId}`, { headers: H }).then(r => r.json() as any);
      return { done: s.status === 'SUCCEEDED', failed: s.status === 'FAILED', progress: s.progress, error: s.task_error?.message };
    }, job, 'meshy preview', 2, 45);

    // 2) refine (adds PBR texture)
    const ref = await fetch(`${MESHY_BASE}/v2/text-to-3d`, {
      method: 'POST', headers: H,
      body: JSON.stringify({ mode: 'refine', preview_task_id: previewId }),
    }).then(r => r.json() as any);
    const refineId = ref?.result || previewId;
    const refined = await this.poll(async () => {
      const s = await fetch(`${MESHY_BASE}/v2/text-to-3d/${refineId}`, { headers: H }).then(r => r.json() as any);
      return { done: s.status === 'SUCCEEDED', failed: s.status === 'FAILED', progress: s.progress, value: s, error: s.task_error?.message };
    }, job, 'meshy refine', 47, 33) as any;

    let glb = refined?.model_urls?.glb;
    const thumb = refined?.thumbnail_url;

    // 3) auto-rig (humanoid) so it binds to the fight skeleton
    if (rig && glb) {
      try {
        const rg = await fetch(`${MESHY_BASE}/v1/rigging`, {
          method: 'POST', headers: H,
          body: JSON.stringify({ input_task_id: refineId, character_height: 1.8 }),
        }).then(r => r.json() as any);
        const rigId = rg?.result;
        if (rigId) {
          const rigged = await this.poll(async () => {
            const s = await fetch(`${MESHY_BASE}/v1/rigging/${rigId}`, { headers: H }).then(r => r.json() as any);
            return { done: s.status === 'SUCCEEDED', failed: s.status === 'FAILED', progress: s.progress, value: s, error: s.task_error?.message };
          }, job, 'meshy rig', 80, 20) as any;
          glb = rigged?.result?.rigged_model_urls?.glb || rigged?.model_urls?.glb || glb;
        }
      } catch (_) { /* keep the unrigged glb; the engine can auto-rig in-browser */ }
    }

    if (!glb) throw new Error('meshy produced no glb');
    this.touch(job, { status: 'succeeded', progress: 100, glbUrl: glb, thumbnailUrl: thumb });
  }

  // ---- Tripo: text-to-3d then rig ----
  private async runTripo(job: GenJob, rig: boolean) {
    const key = process.env.TRIPO_API_KEY!;
    const H = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
    this.touch(job, { status: 'running', progress: 2 });

    const sub = await fetch(`${TRIPO_BASE}/task`, {
      method: 'POST', headers: H,
      body: JSON.stringify({ type: 'text_to_model', prompt: job.prompt }),
    }).then(r => r.json() as any);
    const taskId = sub?.data?.task_id;
    if (!taskId) throw new Error('tripo submit failed: ' + JSON.stringify(sub));

    const done = await this.poll(async () => {
      const s = await fetch(`${TRIPO_BASE}/task/${taskId}`, { headers: H }).then(r => r.json() as any);
      const st = s?.data?.status;
      return { done: st === 'success', failed: st === 'failed' || st === 'cancelled', progress: s?.data?.progress, value: s?.data, error: st };
    }, job, 'tripo model', 2, 78) as any;

    let glb = done?.output?.pbr_model || done?.output?.model;

    if (rig) {
      try {
        const rg = await fetch(`${TRIPO_BASE}/task`, {
          method: 'POST', headers: H,
          body: JSON.stringify({ type: 'animate_rig', original_model_task_id: taskId, out_format: 'glb' }),
        }).then(r => r.json() as any);
        const rigId = rg?.data?.task_id;
        if (rigId) {
          const rigged = await this.poll(async () => {
            const s = await fetch(`${TRIPO_BASE}/task/${rigId}`, { headers: H }).then(r => r.json() as any);
            const st = s?.data?.status;
            return { done: st === 'success', failed: st === 'failed', progress: s?.data?.progress, value: s?.data, error: st };
          }, job, 'tripo rig', 80, 20) as any;
          glb = rigged?.output?.model || glb;
        }
      } catch (_) { /* keep unrigged */ }
    }

    if (!glb) throw new Error('tripo produced no glb');
    this.touch(job, { status: 'succeeded', progress: 100, glbUrl: glb });
  }
}
