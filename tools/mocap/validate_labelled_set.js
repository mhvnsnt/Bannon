#!/usr/bin/env node
// Validate labelled set before/after applying clip scale normalization
const fs = require('fs');
const path = require('path');
const clipsDir = path.join(process.cwd(), 'assets', 'moves', 'clips');
const canonical = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tools', 'mocap', 'canonical_lengths.json'), 'utf8'));
const { computeClipScale } = require('../../dist/src/utils/clipNormalization');

function loadClip(k){ return JSON.parse(fs.readFileSync(path.join(clipsDir, k + '.json'), 'utf8')); }

const examples = ['Illegal_Elbow_Punch','PUMPHANDLE_GERMAN']; // adapt names to real keys
for (const ex of examples) {
  try {
    const clip = loadClip(ex);
    const scale = computeClipScale(clip, 'shR', 'elR', canonical['shR_elR'] || 0.3);
    console.log(ex, 'scale=', scale.toFixed(3));
    // measure raw elbow extension on first frame
    const first = clip.keys && clip.keys[0];
    if (first && first.pose && first.pose['shR'] && first.pose['elR']) {
      const sh = first.pose['shR'], el = first.pose['elR'];
      const raw = Math.hypot(sh[0]-el[0], sh[1]-el[1], sh[2]-el[2]);
      console.log(' raw=', raw.toFixed(3), ' scaled=', (raw*scale).toFixed(3));
    }
  } catch(e) { console.warn('missing clip', ex); }
}
