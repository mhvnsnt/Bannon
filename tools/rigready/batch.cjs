#!/usr/bin/env node
// BANNON batch skinner — "drop a model in Drive, run one command, it's in the game."
//   node tools/rigready/batch.cjs            # skin everything in bank_map.json not yet banked
//   node tools/rigready/batch.cjs --force    # re-skin even if the output exists
// bank_map.json maps incoming filenames (assets/models/incoming/) to banked outputs
// (assets/models/) + height. Weapons/props (entries with prop:true) are COPIED, not skinned —
// the character skinner must never eat a chair.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../..');
const MAP = path.join(__dirname, 'bank_map.json');
const FORCE = process.argv.includes('--force');
const map = JSON.parse(fs.readFileSync(MAP, 'utf8'));
let done = 0, skipped = 0, failed = 0;
for (const [inc, spec] of Object.entries(map)) {
  if (inc.startsWith('_')) continue;
  const src = path.join(ROOT, 'assets/models/incoming', inc);
  const out = path.join(ROOT, 'assets/models', spec.out);
  if (!fs.existsSync(src)) { console.warn(`[batch] missing incoming: ${inc}`); failed++; continue; }
  if (fs.existsSync(out) && !FORCE) { skipped++; continue; }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  try {
    if (spec.prop) {
      fs.copyFileSync(src, out);
      console.log(`[batch] prop banked: ${spec.out}`);
    } else {
      console.log(`[batch] skinning ${inc} -> ${spec.out} (h=${spec.height || 1.85})`);
      execFileSync('node', [path.join(__dirname, 'skin.cjs'), src, out, `--height=${spec.height || 1.85}`],
        { stdio: ['ignore', 'inherit', 'inherit'], timeout: 900000 });
    }
    done++;
  } catch (e) { console.error(`[batch] FAILED ${inc}: ${e.message.split('\n')[0]}`); failed++; }
}
console.log(`[batch] done: ${done} banked, ${skipped} already banked, ${failed} failed`);
process.exit(failed ? 1 : 0);
