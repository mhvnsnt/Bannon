#!/usr/bin/env node
// BANNON Tripo generator — text->3D for the AGENT-OWNED game-only fighters (CLAUDE.md directive).
// Full loop: prompt -> Tripo task -> poll -> download GLB -> auto-SKIN (v4.2) -> bank to assets/models/.
// Needs TRIPO_API_KEY (tsk_…) with CREDITS. Usage:
//   node tools/tripo/generate.mjs VIPER            # one character from gen_prompts.json
//   node tools/tripo/generate.mjs --all            # every game-only fighter missing a model
//   node tools/tripo/generate.mjs --prompt "..." --name FOO
import fs from 'fs'; import path from 'path'; import { execSync } from 'child_process';
const KEY = (process.env.TRIPO_API_KEY || '').trim();
if (!KEY) { console.error('set TRIPO_API_KEY (tsk_…, with credits)'); process.exit(1); }
const BASE = 'https://api.tripo3d.ai/v2/openapi';
const ROOT = path.resolve('.');
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/tripo/gen_prompts.json'), 'utf8'));
const H = `-H "Authorization: Bearer ${KEY}"`;
const post = (body) => JSON.parse(execSync(`curl -sS ${H} -H "Content-Type: application/json" -X POST -d ${JSON.stringify(JSON.stringify(body))} ${BASE}/task`).toString());
const get  = (id)   => JSON.parse(execSync(`curl -sS ${H} ${BASE}/task/${id}`).toString());
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function genOne(name, prompt) {
  const full = `${prompt}, ${CFG._style}`;
  console.log(`[tripo] ${name}: submitting…`);
  const r = post({ type: 'text_to_model', prompt: full, model_version: 'v2.5-20250123', texture: true, pbr: true });
  if (r.code !== 0) { console.error(`[tripo] ${name} submit failed:`, r.message || JSON.stringify(r)); return null; }
  const id = r.data.task_id; console.log(`[tripo] ${name}: task ${id}, polling…`);
  for (let i = 0; i < 120; i++) {
    await sleep(5000);
    const t = get(id); const st = t.data && t.data.status;
    if (st === 'success') {
      const url = t.data.output && (t.data.output.pbr_model || t.data.output.model);
      const raw = path.join(ROOT, 'assets/models/incoming', `${name}.glb`);
      fs.mkdirSync(path.dirname(raw), { recursive: true });
      execSync(`curl -sS -L -o "${raw}" "${url}"`, { timeout: 300000 });
      const out = path.join(ROOT, 'assets/models', `${name}_skinned.glb`);
      console.log(`[tripo] ${name}: downloaded, skinning…`);
      execSync(`node tools/rigready/skin.cjs "${raw}" "${out}"`, { stdio: 'inherit' });
      console.log(`[tripo] ${name}: DONE -> ${path.relative(ROOT, out)}`);
      return out;
    }
    if (st === 'failed' || st === 'cancelled' || st === 'unknown') { console.error(`[tripo] ${name}: task ${st}`); return null; }
    if (i % 4 === 0) console.log(`[tripo] ${name}: ${st} (${(t.data && t.data.progress) || 0}%)`);
  }
  console.error(`[tripo] ${name}: timed out`); return null;
}

(async () => {
  const args = process.argv.slice(2);
  if (args.includes('--prompt')) {
    const prompt = args[args.indexOf('--prompt') + 1];
    const name = args.includes('--name') ? args[args.indexOf('--name') + 1] : 'CUSTOM';
    await genOne(name, prompt); return;
  }
  let targets;
  if (args.includes('--all')) {
    targets = Object.entries(CFG.characters).filter(([n]) => !fs.existsSync(path.join(ROOT, 'assets/models', `${n}_skinned.glb`)));
    console.log(`[tripo] --all: ${targets.length} missing model(s)`);
  } else {
    const n = args[0]; if (!CFG.characters[n]) { console.error(`unknown '${n}'. Known:`, Object.keys(CFG.characters).join(', ')); process.exit(1); }
    targets = [[n, CFG.characters[n]]];
  }
  for (const [name, c] of targets) await genOne(name, c.prompt);
})();
