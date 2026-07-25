#!/usr/bin/env node
/* skintokens_unification.cjs — HONEST wrapper (was a lying stub that printed fake "133% accuracy").
 *
 * Real neural skinning (SkinTokens / UniRig cross-attention) is a GPU/ML task — it CANNOT run in
 * Node. The actual working rigger is tools/unirig/batch_rerig.py against the hosted UniRig space
 * (produces a real 28-joint skinned GLB). This script just delegates to that real pipeline for a
 * character KEY, so "run skintokens" does real rigging instead of printing numbers it never computed.
 *
 *   node tools/unirig/skintokens_unification.cjs <KEY> [KEY2 ...]      (needs HF_TOKEN in env)
 */
const { spawnSync } = require('child_process');
const path = require('path');
const keys = process.argv.slice(2);
if (!keys.length) { console.error('usage: node skintokens_unification.cjs <KEY> [KEY2 ...]'); process.exit(2); }
if (!process.env.HF_TOKEN) console.error('[skintokens] WARNING: HF_TOKEN not set — the UniRig space needs it for queue priority.');
console.log('[skintokens] delegating to the REAL rigger (batch_rerig.py -> hosted UniRig, ~20min/model)…');
const r = spawnSync('python3', [path.join(__dirname, 'batch_rerig.py'), ...keys], { stdio: 'inherit', env: process.env });
process.exit(r.status == null ? 1 : r.status);
