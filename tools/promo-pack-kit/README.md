# Promo Pack Kit — tools

Game-agnostic tooling for the 3D-game promo pipeline (cutscenes, promos, ads).
Canonical spec: `docs/promo/PROMO_PACK_KIT.md`.

## Pipeline

```
scene_grid.py  ->  beat grid + cut sheet (authoring)
      |
      v
   <shoot the shots: model through skin-weight + pose repair,
    owned animation set, real lighting/crowd/pyro>
      |
      v
<measure per-shot metrics with rig-repair / retarget QA / frame analysis>
      |
      v
promo_gates.py  ->  PASS/FAIL per gate, per shot (automated defect gates)
      |
      v
sbs_proof.py  ->  side-by-side v1/v2 proof composites + fix checklist
      |
      v
shot_checklist.md  ->  filled in per character; every box checked = shippable
```

## Tools

- `scene_grid.py` — BPM-parameterized beat grid and cut sheet. Shots are
  defined in beats, so the same shot list works at any tempo. Never hardcodes
  BPM. Companion to `tools/video/beat_edl.py` and `tools/video/make_beat_edit.py`,
  which do edit-time work on captured footage; this one does authoring-time
  planning (what to shoot, on which beats).
- `promo_gates.py` — automated defect gates. Extends the `gate_check.cjs`
  pattern (PASS/FAIL lines, exit 1 on failure) with promo gates: rotation
  error deg threshold (<= 3.0), feet planted, facing==movement, no skin flap,
  no ribbon/exploded geometry, no foot slide, no rope crossing, no broken
  poses. Evaluates measured numbers; it does not measure. Use `--self-test`
  to see it fail the v1 sample metrics (gates that pass everything prove nothing).
- `sbs_proof.py` — side-by-side v1/v2 proof composite: labeled frames plus a
  footer strip with the fix checklist (fixed / not fixed, gate, v1->v2 numbers).
- `shot_checklist.md` — per-character checklist template: per-shot gate
  columns, v1->v2 fix list, canon text check, owned-animation check,
  deliverable formats.

## Examples

- `examples/metrics_el_toro_v1_walk_out.json` — sample per-shot metrics (v1,
  should FAIL gates; numbers from the owner's fix list + QA chart).
- `examples/fixes_el_toro_v2.json` — sample fix checklist for the proof builder.
- `examples/proof_walk_out.png` — generated proof composite (see below).

## Quick verify

```
python3 scene_grid.py --bpm 120 --duration 50 --fps 24 --table
python3 promo_gates.py --self-test            # expect FAIL on the v1 sample
python3 sbs_proof.py --v1 <v1.png> --v2 <v2.png> --title "..." \
    --fixes examples/fixes_el_toro_v2.json --out proof.png \
    --inspected "f_00456,f_00912,f_01728"   # exact frames you actually looked at
```
Proof composites embed sha1 fingerprints of both input frames, the inspected
frame list, and a "version, never overwrite" marker (media proof standard).
No AI faces on characters — the kit never generates or swaps faces; renders
use the owner's own rigged models (masked where the design calls for it).
