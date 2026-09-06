# Environment reference snapshots (2026-07-12)

Honest captures of the CURRENT three.js procedural arena — the "before" material for the Tripo
image-to-3D environment upgrade (owner directive: environment must match the new model quality).

- `env_*` — in-match style set (FIRE PIT theme, full bloom — ropes glow hot).
- `envc_*` — clean geometry set (bloom 0.12, fighters hidden) — feed THESE to Tripo as shape seeds.

What Tripo needs to replace, in priority order:
1. RING: deck + apron skirt + 4 posts + turnbuckle pads + ropes (ropes stay procedural verlet —
   generate the ring WITHOUT ropes; the engine strings its own physics ropes at the post heights).
2. ARENA BOWL: raked seating sections w/ real crowd risers (current crowd = instanced boxes on a
   flat floor), entrance stage + ramp, ring-side barricade, announcer desk (desk GLB already
   banked at assets/models/props/wwe2k22_announcer_desk.glb).
3. Steel steps at two corners (3MF source in repo root zip), ring-side floor mats.

Suggested Tripo prompts live in tools/tripo/gen_prompts.json under "env_*" keys.
HARNESS GOTCHA (recorded in .claude/skills/bannon-verify): freecamEnter() HIDES the ring + other
fighters (CAW model-viewer isolation). For environment/match shots set FREECAM.on=true manually
and stub freecamTarget=()=>null — never call freecamEnter().
