#!/usr/bin/env node
/**
 * render_sfx.js — synthesized SFX renderer for the Bannon / video pipelines.
 *
 * Vendored engine: jsfxr (chr15m/jsfxr), released into the public domain
 * under The Unlicense. See UNLICENSE and README.md in this directory.
 *
 * Generates original WAV sound effects from parameter presets — no samples,
 * no licensing risk, output is yours.
 *
 * Usage:
 *   node render_sfx.js --preset hit --out hit.wav
 *   node render_sfx.js --preset slam --out slam.wav --variations 3
 *   node render_sfx.js --list
 *
 * Node quirk: this jsfxr build exposes itself on globalThis.jsfxr after
 * require (UMD factory), not on the require() return value.
 */
const fs = require('fs');
const path = require('path');

const _mod = require('./sfxr.cjs');
// CJS build: factory result is the require() return value.
// ESM/browser build: factory result lands on globalThis.jsfxr.
const jsfxr = (_mod && _mod.Params) ? _mod : globalThis.jsfxr;
if (!jsfxr || !jsfxr.Params) {
  console.error('FATAL: jsfxr did not initialise (globalThis.jsfxr missing)');
  process.exit(1);
}
const W = jsfxr.waveforms;

// Presets tuned for wrestling / promo-video use. All values are jsfxr
// Params fields; wave_type: 0=square 1=sawtooth 2=sine 3=noise.
const PRESETS = {
  hit: {        // punch / strike connect — snappy square blip, pitch drop
    wave_type: W.SQUARE, p_env_attack: 0, p_env_sustain: 0.08,
    p_env_punch: 0.4, p_env_decay: 0.25, p_base_freq: 0.45,
    p_freq_ramp: -0.55, p_freq_dramp: -0.2,
  },
  kick: {       // heavier strike — lower, meatier
    wave_type: W.SQUARE, p_env_attack: 0, p_env_sustain: 0.1,
    p_env_punch: 0.5, p_env_decay: 0.3, p_base_freq: 0.3,
    p_freq_ramp: -0.6, p_freq_dramp: -0.25,
  },
  slam: {       // body slam / big impact — noise burst + low thump
    wave_type: W.NOISE, p_env_attack: 0, p_env_sustain: 0.12,
    p_env_punch: 0.6, p_env_decay: 0.45, p_base_freq: 0.18,
    p_freq_ramp: -0.4, p_arp_mod: 0.3, p_arp_speed: 0.4,
  },
  whoosh: {     // swing miss / transition whoosh — filtered noise sweep up
    wave_type: W.NOISE, p_env_attack: 0.25, p_env_sustain: 0.15,
    p_env_decay: 0.25, p_base_freq: 0.25, p_freq_ramp: 0.65,
    p_lpf_freq: 0.7, p_lpf_ramp: 0.3,
  },
  bell: {       // ring bell — sine, long decay
    wave_type: W.SINE, p_env_attack: 0, p_env_sustain: 0.35,
    p_env_decay: 0.7, p_base_freq: 0.75, p_vib_strength: 0.15,
    p_vib_speed: 0.5,
  },
  pop: {        // crowd pop / UI blip — bright square chirp up
    wave_type: W.SQUARE, p_env_attack: 0, p_env_sustain: 0.06,
    p_env_decay: 0.18, p_base_freq: 0.55, p_freq_ramp: 0.45,
  },
  thud: {       // mat thud / footstep — short low noise knock
    wave_type: W.NOISE, p_env_attack: 0, p_env_sustain: 0.03,
    p_env_punch: 0.5, p_env_decay: 0.12, p_base_freq: 0.22,
    p_freq_ramp: -0.3,
  },
  powerup: {    // entrance pyro cue / hype sting — rising saw
    wave_type: W.SAWTOOTH, p_env_attack: 0.1, p_env_sustain: 0.2,
    p_env_decay: 0.3, p_base_freq: 0.3, p_freq_ramp: 0.55,
    p_arp_mod: 0.4, p_arp_speed: 0.6,
  },
};

function buildParams(presetName, seed) {
  const preset = PRESETS[presetName];
  if (!preset) throw new Error(`unknown preset "${presetName}"`);
  const p = new jsfxr.Params();
  Object.assign(p, preset);
  p.sound_vol = 0.5;
  p.sample_rate = 44100;
  p.sample_size = 16;
  if (seed !== undefined) {
    // deterministic-ish variation: nudge freq + decay by seeded jitter
    const rnd = mulberry32(seed);
    p.p_base_freq = clamp01(p.p_base_freq + (rnd() - 0.5) * 0.08);
    p.p_env_decay = clamp01(p.p_env_decay + (rnd() - 0.5) * 0.1);
  }
  return p;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function clamp01(v) { return Math.max(0, Math.min(1, v)); }

function renderToFile(params, outPath) {
  const wave = new jsfxr.SoundEffect(params).generate();
  const m = wave.dataURI.match(/^data:.+\/(.+);base64,(.*)$/);
  if (!m) throw new Error('jsfxr did not return a data URI');
  fs.writeFileSync(outPath, Buffer.from(m[2], 'base64'));
}

function main() {
  const args = process.argv.slice(2);
  const get = (flag, dflt) => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : dflt;
  };
  if (args.includes('--list') || args.includes('-l')) {
    console.log('presets: ' + Object.keys(PRESETS).join(', '));
    return;
  }
  const preset = get('--preset');
  if (!preset) {
    console.error('Usage: node render_sfx.js --preset <name> --out <file.wav> [--variations N] [--seed N]');
    console.error('       node render_sfx.js --list');
    process.exit(1);
  }
  const out = get('--out', `${preset}.wav`);
  const variations = parseInt(get('--variations', '1'), 10);
  const seedBase = parseInt(get('--seed', String(Date.now() % 100000)), 10);

  if (variations <= 1) {
    renderToFile(buildParams(preset), out);
    console.log(`wrote ${out}`);
  } else {
    const dir = out.replace(/\.wav$/i, '');
    fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < variations; i++) {
      const f = path.join(dir, `${preset}_${i + 1}.wav`);
      renderToFile(buildParams(preset, seedBase + i), f);
      console.log(`wrote ${f}`);
    }
  }
}

main();
