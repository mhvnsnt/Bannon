#!/usr/bin/env node
// Pull the owner's generated models from the Tripo platform via the official API.
// Needs TRIPO_API_KEY (a tsk_… key from platform.tripo3d.ai -> API Keys). tcli_ CLI tokens do NOT work.
//   node tools/tripo/pull_library.mjs            # list recent tasks
//   node tools/tripo/pull_library.mjs --pull     # download every successful model to assets/models/incoming/
// Multiple accounts: TRIPO_API_KEYS="tsk_a,tsk_b" iterates them all.
import fs from 'fs'; import path from 'path'; import { execSync } from 'child_process';
const KEYS = (process.env.TRIPO_API_KEYS || process.env.TRIPO_API_KEY || '').split(',').map(s => s.trim()).filter(Boolean);
if (!KEYS.length) { console.error('set TRIPO_API_KEY (tsk_…) — see .env.example'); process.exit(1); }
const PULL = process.argv.includes('--pull');
const OUT = path.resolve('assets/models/incoming');
const j = (cmd) => JSON.parse(execSync(cmd, { maxBuffer: 1 << 26 }).toString());
for (const key of KEYS) {
  const who = key.slice(0, 12) + '…';
  try {
    // Tripo task listing (paginated); each success task carries output.model / pbr_model URLs
    const r = j(`curl -sS -H "Authorization: Bearer ${key}" "https://api.tripo3d.ai/v2/openapi/user/tasks?page=1&page_size=50"`);
    const tasks = (r.data && (r.data.tasks || r.data.list)) || [];
    console.log(`[tripo ${who}] ${tasks.length} recent tasks`);
    for (const t of tasks) {
      const url = t.output && (t.output.pbr_model || t.output.model);
      if (!url || t.status !== 'success') continue;
      console.log(`  ${t.task_id}  ${t.type}  ${t.status}`);
      if (PULL) {
        fs.mkdirSync(OUT, { recursive: true });
        const dest = path.join(OUT, `tripo_${t.task_id}.glb`);
        if (!fs.existsSync(dest)) { execSync(`curl -sS -L -o "${dest}" "${url}"`, { timeout: 300000 }); console.log(`    -> ${dest} (${fs.statSync(dest).size} bytes)`); }
      }
    }
  } catch (e) { console.error(`[tripo ${who}] failed: ${e.message.split('\n')[0]}`); }
}
