# BANNON — working memory (read me first, every session)

Standing context distilled from the owner's direct instructions + the books. `AGENTS.md` is the
North Star (additive-only, surgical, physics-first); `window.MANIFESTO` / `window.BLUEPRINT` in
`BANNON_v150.html` are the live soul + roadmap. This file is the session-to-session memory.

## Quality bar / references to study before judging any system
- **Combat & physics:** Steve Masson's *Neckbreaker: Visceral Pro Wrestling* (active ragdoll, no two
  moves alike), *Endorphin Pro Wrestling*, EA *UFC* (weight transfer, strike drive), *WWE 2K26*
  (moveset library depth, POSITIONS/zoning: front/back grapple, grounded head-side/leg-side, corner,
  apron, rope-rebound, springboard, middle/top rope, in-between animations — actual rope vaulting
  from different positions), *Casual Pro Wrestling*, MDickie *Wrestling Empire* (breadth/sandbox).
- **Story/modes:** Tekken-depth story, WWE-2K-like Universe/Career loops with **proprietary names**
  (no trademarked gimmick names). "God Within" mode = Devil-Within-style, daemon as core feature,
  mixing GAME canon (10-heavens/Enoch physics layer, `Cosmology.ts`) with BOOK canon (`canon/*.md`).
- **Models/creation:** WWE 2K + Cyberpunk 2077 morph depth; Blender-grade authored blends. The GLB
  pipeline (import + per-character `CHAR_MODEL` + forge) is the AAA path; the procedural body is the
  fallback and must stay respectable.

## Owner's working rules (repeated, binding)
- No hedging, no "honest ceiling" talk, no laziness. Act like a senior expert: research, then fix.
- USE THE SENSES/ACTUATORS: freecam + Playwright screenshots, `bodyCheck()`, `MANIFESTO.overview()`,
  `BLUEPRINT.next()`, MOTION CHECK — verify by looking/measuring, never by assumption.
- Verify → commit → push each brick. Don't leave work half-attached.
- Don't leave things to the 3D-modeling collaborator; stay ahead of him and produce base examples.

## Character visual canon (books + owner sketches — the identity stack)
Marquis Deshaun Whitacre → **Solaris Justice** (past face) → **Bannon** (masked heel) → **Maime**
(alter-ego beneath). Same man, three looks, three movesets/voices:
- **BANNON** — "The Broken Architect / The Executioner." Metallic steel-blue **3/4 UPPER mask**
  (brow→below nose) with tribal/mechanical panel detail, **free-floating jaw/chin plate** with a
  "U" engraving, dark eye sockets; blond-brown **dreadlocks**; brown skin, muscular. Canon sketches:
  `assets/reference/bannon_sketches/`. In-engine: `CHAR_FACEGEAR.BANNON` (+ `BANNON_NOIR` alt =
  gunmetal mask, black dreads). Controlled, processed voice.
- **MAIME** — NO metal mask. **White face paint overlaid with black skull/psychotic-clown hybrid**
  (Sting visual nod; Mankind/Cactus Jack psychology). Black tattered button-up w/ torn sleeves, long
  necktie (incl. the "Pooh Bear tie"), taped wrists, long dark jogging pants. Raw/manic/high-pitched
  voice ("Verbal Leakage"). Usable BOTH as Bannon alt attire (same moves) and standalone character
  (own moves). Reference photos: `assets/reference/maime_photos/` (shot in RED stage light —
  correct to normal light: WHITE paint, near-black locs, black studded gear). Painted look is LIVE
  in-engine via `__maimePaintTex` + `CHAR_FACEGEAR.MAIME{facepaint:1}`: jagged black "M" forehead,
  blacked sockets + tear drips, downturned black lips. HAIR = freeform twist SPIKES standing UP from
  the crown (CHAR_FACEGEAR hairUp:1, NOT hanging locs — that's Bannon). JACKET STATES (owner spec):
  enters WITH the studded jacket, REMOVES it for battle (battle look = shirtless + dark jogging
  pants); casual cutscenes wear a casual jacket. Alt looks: MAIME_JACKET (ring) / MAIME_CASUAL /
  MAIME_TATTERED (black tattered button-up + blue Pooh tie via the seg.tie mesh + jogging pants;
  torn sleeves + wrist tape = texture debt). Auto entrance/cutscene swap lands with the entrance
  system.
- **SOLARIS JUSTICE** — the "golden hero" persona (gold/solar palette), currently a symbolic
  hologram in Book 4; owner will detail the look later. Do not design ahead of the owner's spec.
- Other canon characters: `canon/00_cast_and_world.md` + `Off The Top Rope cast and characters .txt`
  + `canon/characters/` dossiers (Stan Combs overlord, Edwin Kennedy/AWE chairman, Stick Up/Jackboy
  w/ finishers, Finxsse match notes, free agents incl. TIGHTROPE the female flyer). Finisher specs
  live in `window.CHAR_FINISHERS` (Finxsse: CHAINSNATCHER backstabber + GETBACKK F5-class; Stick Up:
  LEAP OF FAITH swanton family, FIRE THUNDER DRIVER, twisting cutter) — wire into MOVESET_DB in the
  moveset-library pass. Body diversity: CHAR_BODY axes (musc/fat/fem/hips/glutes/waist) span curvy
  (Tyneshia), athletic-lean female (Tightrope, Karma), heavy-soft (Yorkshire Grit, Stan), suits.

## God-Mode OS (godmode/ — extracted from the owner's newest remix zip; older zips at repo root)
- The owner's AI-OS layer: daemon/, app/, src/server/EvolutionDaemon.ts, training_data/*.jsonl,
  vault/rag_vault.db, Bannon.Modelfile (Ollama persona), Railway/Firebase configs.
- `godmode/BIOMECHANICAL_SIMULATION_SPEC.md` = the biomech grid (autonomic saturation ODE, grab-event
  volumetric mesh bulge, thermodynamic sweat shader, procedural breath audio, FACS mapping). FIRST
  INTEGRATION LANDED: thermodynamic sweat (BBODY.sync roughness 0.58->~0.18 with exertion S_t).
  NEXT from spec: grab-event vertex bulge at grapple grips (ties into two-body Phase 3), breath audio.
- `blender-mcp-main.zip` (repo root) = Blender MCP server: owner installs addon.py in Blender +
  registers the MCP server with Claude; then I can drive Blender directly (FBX->GLB conversions,
  Auto-Rig Pro retargets, shape-key authoring).

## Verification harness (works headless in this sandbox)
- `scratchpad/pwtest/`: local server + vendored three.js/GLTFLoader (`test.html` rebuilt from
  `BANNON_v150.html` by replacing CDN URLs with `/vendor/three/*`). Chromium at
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, swiftshader.
- Start a real match: `window.MATCH_SETUP={...}; startFight()`. Freecam: `freecamEnter()` +
  set `FREECAM.{tx,ty,tz,dist,yaw,pitch}` (loop renders from it). Screenshot → actually LOOK.
- Syntax gate: extract `<script>` blocks → `new Function(code)` (top-level-await block is a known
  false positive). Daemon: `npx tsc --noEmit` must stay at 0 errors.

## Model/gen pipeline state
- GLB import binds to the fight rig (BONE_MAP; Mixamo names work), morphs → sliders; imported model
  fully REPLACES the procedural body. Per-character unique models: `CHAR_MODEL` /
  `assignCharModel(key,url,name)` — persists, loads on either side.
- Prompt→model: daemon `CharacterModelGen` (providers: `self` = OUR forge via `OWN_GEN_URL`
  [preferred], meshy, tripo) + game `generateCharacterModel(prompt,{side,characterKey})`.
  `forge_server/` = our own GPU service (TRELLIS/Hunyuan + UniRig; `stub` backend proves the loop).
  Railway hosts the daemon (CPU); the model runs on a GPU host (HF Space/Modal/RunPod).
- NEXT (task #20): feed the sketch images as image-to-3D seeds; per-character curated prompts;
  in-game GENERATE + attire-per-prompt + full EDIT panel.

## Raw asset drops (repo root zips, from the owner — Blender-side pipeline fuel)
- `Action Adventure Pack.zip` — Mixamo X Bot + animation FBXs (idle/walk/run/cover): convert to GLB
  (BlenderGoodies convert.py) -> STUDIO mocap clips.
- `BlenderGoodies.zip` — rigged CharacterAndRig.blend + convert/retarget scripts + Auto-Rig Pro.
- `rig_tools_3.67.12.zip` — Auto-Rig Pro (Blender addon; teammate installs in Blender).
- `uploads_files_147201_Steel_Steps.zip` — ringside steel steps (3MF -> convert to GLB prop).

## Combat roadmap (task #21, from BLUEPRINT.next)
SHIPPED: springboard rope-plant VAULT in-between (state 'vault' -> dive from rope height); grounded
HEAD/FEET/SIDE zoning (groundZoneOf: verlet head-vs-midfeet axis, backward-fall facing fallback)
flavoring grounded strikes' target/damage/name; biomech sweat (spec §C). PHASE 3 SHIPPED: two-body
PD load coupling (poseGrab st 2/3 reads victim `_loadErr/_loadVel` from poseGrabbed telemetry,
tau=0.55·err−0.07·vel clamped ±0.085 into attacker pelvis/chest/head/knees — attacker visibly bears
the load) + grab-event vertex bulge (spec §B: victim `_gripPts` at attacker palms, BBODY.update digs
−0.045·amp·Φ inside R=0.15 w/ rim bulge to 1.6R + somatic pulse sin(9t)·S_t); RUNNING/REBOUND strike
family in playerAttack (shoulder block/lariat/knee/big boot, power ×(1+0.45·momentum+0.30·rebound));
per-zone grounded traj/power/name (OVERHAND·HEAD / STRAIGHT·LEGS / HOOKING·RIBS). Verified via
phase3b.js: stages hold 1→2→3 w/ loadErr+grip live, gripNearestVert 0.088 (<R dig-in), pelvisVar
0.0097, RUNNING LARIAT@96, STOMP·LEGS. GOTCHA: v72 weight-class wrapper turns stage-1 grappleAdvance
into instant `grappleDeliver('drop')` when !canLiftOpponent — heavy victims (GOLEM) skip lift/carry
BY DESIGN; stub `canLiftOpponent` in tests. GOTCHA 2: `this.J[j]` are Spring3 — write `.tgt.y`, NOT
`.y` (a bare `.y +=` is a silent NaN no-op; the PD block shipped with that bug, fixed, pelvisVar
0.0097→0.0326 once live). ALSO SHIPPED: GROUNDED ZONE DELIVERY in poseAttack (whole-body posture per
zone: HEAD = mounted-hammer knee drop + torso pitch, FEET = upright forward hinge chop, SIDE = dip +
lateral hinge rib drop; grounded aim clamps to mat 0.10 and targets the zone's verlet joint);
groundZoneOf fallback threshold 0.35→0.18 (slumped bodies carry a real axis — the facing guess was
misreading forward falls as FEET). Verified: all 3 zones classify + name + pose correctly (gzvis.js
freecam shots). NEXT: UFC weight-strike tuning; vault variants from apron/mid/top; wire
CHAR_FINISHERS into MOVESET_DB.

## Morph system state (refined this pass)
Oval SKULL rings (width<depth) + jaw ring on the neck tube; face sliders live per-ring: faceJawW/L,
faceSkullW/L (ringGirth ti===2). NEW `_face` relief (gaussians on the head tube r∈[0.55,1]):
faceCheek/faceChin/faceBrow/faceNose sculpt real geometry (verified cheek delta 0.0266); FACE SCULPT
CAW section + `traps` (trapezius relief mult) + `bust` sliders. window.CHAR_FACE = per-character
skull/jaw/cheek/chin signatures (~26 named heads, merged after applyBodyComp so explicit shape wins).
Independent BUST slider (0.6 flat..1.6 pronounced) x fem, seeded per female: Tyneshia 1.35 /
Karma 1.0 / Tightrope 0.72 — the "some sexy, some regular" diversity axis.
Network allowlist is LIVE for curl fetches (cdnjs/github-raw/HF 200) — pull assets directly; the
Playwright harness stays on the vendored copies (Chromium proxies differ).
