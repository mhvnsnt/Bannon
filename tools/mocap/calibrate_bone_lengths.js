#!/usr/bin/env node
// Calibrate canonical bone lengths from labelled set (MoMask) and write canonical.json
const fs = require('fs');
const path = require('path');
const { computeClipScale } = require('../../dist/src/utils/clipNormalization');

// fallback: load clips from assets/moves/clips/*.json
const CLIPS_DIR = path.join(process.cwd(), 'assets', 'moves', 'clips');
const OUT = path.join(process.cwd(), 'tools', 'mocap', 'canonical_lengths.json');

function loadClip(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch(e){ return null; }
}

function gather() {
  const files = fs.readdirSync(CLIPS_DIR).filter(f => f.endsWith('.json'));
  const jointPairs = [['shR','elR'], ['shL','elL']];
  const sums = {}; const counts = {};
  for (const f of files) {
    const clip = loadClip(path.join(CLIPS_DIR, f)); if(!clip) continue;
    for (const p of jointPairs) {
      const a = p[0], b = p[1];
      const keys = clip.keys || [];
      let rest = null;
      for (const k of keys) if (k.pose && k.pose[a] && k.pose[b]) { rest = k; break; }
      if (!rest) continue;
      const da = rest.pose[a]; const db = rest.pose[b];
      const len = Math.sqrt(Math.pow(da[0]-db[0],2)+Math.pow(da[1]-db[1],2)+Math.pow(da[2]-db[2],2));
      const key = `${a}_${b}`;
      sums[key] = (sums[key]||0) + len; counts[key] = (counts[key]||0) + 1;
    }
  }
  const out = {};
  for (const k of Object.keys(sums)) out[k] = sums[k]/counts[k];
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log('Wrote canonical lengths to', OUT, out);
}

gather();
