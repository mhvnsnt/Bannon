# tools/audio/jsfxr — synthesized SFX generator (vendored)

Original, license-clean sound effects for promos, entrance videos, and games.
No samples, no packs, no licensing risk: every sound is synthesized from
parameters at render time, so the output is yours.

## Source

- **Upstream:** https://github.com/chr15m/jsfxr (Chris McCormick)
- **License:** The Unlicense — public domain (see `UNLICENSE` in this directory)
- **License verified:** 2026-10-05, from the source repo's UNLICENSE file
- **Vendored files:** `sfxr.cjs`, `riffwave.cjs` (renamed from `.js` — this repo's
  `package.json` sets `"type": "module"`, and `.js` would load as ESM),
  `sfxr.mjs`, `riffwave.mjs` (browser/ESM builds), `sfxr-to-wav` (upstream CLI),
  `UNLICENSE`
- **Our additions:** `render_sfx.cjs` (preset CLI), this README

## Use

```bash
node tools/audio/jsfxr/render_sfx.cjs --list
node tools/audio/jsfxr/render_sfx.cjs --preset hit --out hit.wav
node tools/audio/jsfxr/render_sfx.cjs --preset slam --out slams --variations 5
```

Presets: `hit` `kick` `slam` `whoosh` `bell` `pop` `thud` `powerup`.
Output: 16-bit 44.1 kHz mono WAV. `--variations N` renders N seeded variants
into a directory (round-robin playback kills the "same sample twice" fatigue).

## Notes

- Node quirk (documented, not a bug in our code): this jsfxr build's UMD
  wrapper exposes the factory result on `globalThis.jsfxr` in ESM contexts
  and as the `require()` return value in CJS. `render_sfx.cjs` handles both.
- For richer one-shot design work, the browser UI at https://sfxr.me
  (same engine) exports share-URL synth definitions this CLI can render.
- Curated CC0 recorded impacts (Kenney) live in `assets/audio/sfx/kenney/`
  for when synthesis is too thin — layer both.
