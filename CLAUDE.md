# BANNON — working memory (read me first, every session)

> **⛓️ BINDING: `docs/AI_WORKING_CONTRACT.md` governs HOW every AI works on this game** (scope
> recognition, FULL-integration protocol, pull-don't-reinvent, no-hallucination/verify-with-senses,
> no-stubs-as-features, build-one-complete-game, secrets). Read it before acting. It exists because a
> year of multi-AI work produced spaghetti + false "done" claims — do not repeat that.

Standing context distilled from the owner's direct instructions + the books. `AGENTS.md` is the
North Star (additive-only, surgical, physics-first); `window.MANIFESTO` / `window.BLUEPRINT` in
`BANNON_v150.html` are the live soul + roadmap. This file is the session-to-session memory.

## Quality bar / references to study before judging any system
- **Combat & physics:** Steve Masson's *Neckbreaker: Visceral Pro Wrestling* (active ragdoll, no two
  moves alike), *Endorphin Pro Wrestling*, EA *UFC* (weight transfer, strike drive), *WWE 2K26*
  (moveset library depth, POSITIONS/zoning: front/back grapple, grounded head-side/leg-side, corner,
  apron, rope-rebound, springboard, middle/top rope, in-between animations — actual rope vaulting
  from different positions), *Casual Pro Wrestling*, MDickie *Wrestling Empire* (breadth/sandbox).
- **Fire Pro Wrestling standouts** (owner add, 2026-07-05): per-move logic priority + deep
  edit/simulation focus. **OWNER VETO: NO timing-minigame grapples/lockups** ("that will take away
  realism and simulation from our physics based game") — the tie-up stays physics/stamina-resolved
  (the existing `_tryEscape` stamina-vs-gripStrain roll is the correct model; never replace it with
  a timing contest). **Japanese wrestling/boxing-sim lineage** (King of Colosseum et al): stiff
  strike exchanges, selling logic. **Urban Reign / Def Jam**: environmental brawling, grab-anywhere
  freedom, multi-man chaos, momentum/crowd hype. **Tekken 5** lessons = per-character STORY depth +
  juggle physics — explicitly NOT arcade hit-bloom. All of this is baked in-game as
  `window.QUALITY_BAR` (MANIFESTO key `soul.qualityBar`). The identity: physics-based CREATIVE
  FREEDOM — degrees of freedom in combat/grappling/dives, never canned animation.
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
(alter-ego beneath). Same man, three looks, three movesets/voices. WIRED as `window.MARQUIS_PERSONAS`
(persona = own moveset/finisher/look; MAIME ALSO works as a Bannon ATTIRE via CHAR_ALTS — persona vs
attire both supported, WWE-2K model). **BANNON's CANON finisher (Book 1, was a placeholder): THE
STRUCTURAL COLLAPSE = deadlift German suplex → THE RING OF SATURN submission, held until the opponent
is visibly broken** (FINISHER_MOVES.BANNON pos BACK_SUPLEX + sub tag). MAIME fin = VERBAL LEAKAGE
(DDT spike). SOLARIS_JUSTICE now a selectable persona (gold/solar palette, high-flying justice
moveset, THE SOLAR FLARE — placeholder name, owner art pending; books define the concept: the
idealistic "truth and justice" face Marquis was before the betrayal made Bannon). Bannon's OTHER
canon moves (Book 1): Deadlift German Suplexes, Running Powerslam (onto thumbtacks), Boston Crab,
Deadlift Spinebuster, self-destructive Flying Headbutt; carries a coiled steel cable as a symbolic
weapon. Mask = symbolic armor (Sun in Scorpio) w/ a functional jaw for promos; visual = Mankind/Kane
+ MF DOOM. Every canon char has an "OTR" (Outside The Ring) civilian persona classed Aligned/
Contrasting/Blurred — see canon/00_cast_and_world.md (READ IT — deep per-character detail, signatures,
finishers, OTR personas, numerology/astrology "character engine"). Books: canon/01..06_*.md are the
per-book summaries; raw texts are the "Off The Top Rope Book N" .txt files at repo root (DO NOT
commit those — commercial manuscripts; the canon/*.md distillations are the committed knowledge).
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
- FORGE BLUEPRINT (v155, `docs/FORGE_blueprint.md`) — the full "our own Tripo3D/Convert3D, free, no
  credit limits, in-game" map. Verdict: the 3-machine loop (game→daemon `self`→`forge_server` GPU)
  was already ~80% built; this pass CLOSED two real gaps in `forge_server/app.py`:
  (1) **TOPOLOGY GUARD** `post_process` — weld + degenerate/dup-face cull + winding fix + quadric
  decimate to `FORGE_TARGET_TRIS` (15k) BEFORE rigging. This is the differentiator over commercial
  meshes for a PHYSICS game: 300–500k-tri AI output drags the solver + shatters MAX_BODY_VEL; verified
  327k→15000 tris watertight valid GLB. Degrades gracefully (no decimator ⇒ weld+passthrough, never
  fails a job). Env `FORGE_DECIMATE`/`FORGE_TARGET_TRIS`. (2) **IMAGE→3D SEED** — `image` field on
  GenReq (data: URI or URL) + `_load_image`; a SKETCH (assets/reference/*) or concept sheet drives
  shape (image→3D) instead of text-only. Verified: stub loop intact, decimation + data-URI loader.
  REMAINING (last 20%, in the doc): lore→prompt endpoint, in-game image-seed UI, storage+roster
  injection (Supabase/CloudPersistence), curated canon prompts, auto BANNON_DNA.capture on generate.

## Raw asset drops (repo root zips, from the owner — Blender-side pipeline fuel)
- `Action Adventure Pack.zip` — Mixamo X Bot + animation FBXs (idle/walk/run/cover): convert to GLB
  (BlenderGoodies convert.py) -> STUDIO mocap clips.
- `BlenderGoodies.zip` — rigged CharacterAndRig.blend + convert/retarget scripts + Auto-Rig Pro.
- `rig_tools_3.67.12.zip` — Auto-Rig Pro (Blender addon; teammate installs in Blender).
- `uploads_files_147201_Steel_Steps.zip` — ringside steel steps (3MF -> convert to GLB prop).

## Integrated drops (2026-07-05 pass — zips opened, gold extracted into the repo)
- **`docs/mocap_orientation_master_prompt.md` — BINDING owner rules for ALL move/mocap/pose work.**
  Orientation before magnitude: verify body up-vector, facing vs opponent, attacker side, and joint
  bend direction via full-FK world transforms BEFORE trusting any rotation number. Documented failure
  modes: frog splash built like a dropkick, swanton/moonsault mirrored, suplex families wrongly
  merged. READ IT before authoring/judging any move.
- `assets/mocap/mocap_data_partial.json` — first extracted two-fighter clip (AlternatingForearms,
  144 joints, 97 frames, phases + joint_curves + hip_height_curve). `tools/extract_anim.py` = the
  extractor. Feed into STUDIO clips / grapple mocap slots (poseGrabbed LIFT/CARRY hooks exist).
- `godmode/` REFRESHED from `God-Mode-OS-D3MN-V2-main (4).zip` (newest; (3) older, superseded).
  New: `BANNON_AAA_v21_2K_mocap_2.html` (owner's 2K-mocap game snapshot, 41 STUDIO.clips refs —
  HARVEST TARGET for v150 clip import), `BANNON_SWARM_BUILDER_v50_1.html`, `orchestrator-core.ts`,
  new daemon components (AP2SpendControls/ActuatorControlPanel/DynamicToolForge/…), scripts for
  cloudflare-tunnel + termux daemon. Kept our extra `app/`, `vault/`, `check_db.cjs`.
- `spatial-command-architecture-(sca) (7).zip` — owner's AI-Studio (Gemini) scaffold of the same
  architecture (DaemonCore/CombatAI/MatchDirector TS mirrors — we already have better in-repo).
  Gold extracted (mocap json/extractor/rules doc above); rest is reference only.
- `harness-main.zip` + `claude-plugins-official-main.zip` — Claude Code plugin tooling (reference
  for making me more autonomous; marketplace format). `ai-website-cloner-template-master.zip` —
  agent skill template reference (used as the model for `.claude/skills/bannon-verify/SKILL.md`,
  which now encodes the whole verification-harness recipe + gotchas — future sessions start hot).
- `palmier-pro-main.zip` → GOLD EXTRACTED to `assets/reference/shaders/*.metal` (11 shaders).
  SHIPPED (v153): BROADCAST GRADE post pass — a ShaderPass in the existing bloom composer
  (after bloom, before gamma): shadow lift + filmic tone curve + saturation + S-curve contrast +
  warmth + vignette + animated film grain, all ported from the palmier math. Toggle
  `window.BROADCAST_GRADE`, live-tune `window.GRADE.{sat,con,warm,vig,grain,shadow}`. Verified
  on/off screenshots in-harness (postprocessing example scripts now vendored in pwtest/vendor/three
  + rebuild.js maps their CDN URLs). Remaining palmier gold for later: LUTTetra (arena mood LUTs),
  HueCurves (per-arena palettes), Clarity (local contrast).
- `tools/blender/` — BlenderGoodies convert.py + external_run.py + Instructions.txt (FBX→GLB +
  Auto-Rig Pro retarget; teammate/Blender-MCP fuel). Action Adventure Pack = X Bot + idle/walk/run
  FBX clips for the STUDIO locomotion set once Blender-MCP is connected.

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
freecam shots). ALSO SHIPPED: UFC WEIGHT-STRIKE TUNING — `Fighter.strikeMass()` (height×_specBuild,
same proxy as canLiftOpponent); registerHit power ×massF=clamp(1+0.22·(mA−1),0.78,1.20), knockback
(visceralImpact) ×kbF=clamp((mA/mD)^0.6,0.70,1.45); poseAttack swing speed ×clamp(1−0.12·(m−1),
0.85,1.08). Verified wtune.js: TIGHTROPE(0.90)→GOLEM(1.79) massF 0.978/kbF 0.70; reverse 1.175/1.45.
TASK #21 COMPLETE. REGRESSION HUNT (owner report 2026-07-05, all fixed+verified):
(1) LAG/"struggle-to-lift broken"/"forklift arc broken" = ONE root cause: crowd was 227 groups of
1-5 unique meshes/materials (~380 draw calls) -> frame collapse -> dt pegged at 0.05 cap -> every
spring (GLOCK carry, crane) ran ~0.3x speed, lifts never reached climax. Crane input, spring target
(0.696@cl0), attacker bend all measured CORRECT — it was frame budget. Crowd now 5 InstancedMeshes
w/ instanceColor + direct matrix-array Y bob. Diagnosis pattern: wrap poseGrabbed count + __lastDt.
(2) "very bad slave posing in phases/sub-phases" = v93 RECEIVER CARRY POSE wrapper OVERWROTE the
authored per-move slave/liftPoses with one generic fetal-curl pose for every move at st 2-3. Now
defers to authored poses (only faint additive flail) and full-poses only positions with no slave.
Verified: CHOKESLAM (new GOOSENECK->HOIST->DANGLE liftPoses) vs FIREMANS_CARRY (new DUCK-UNDER->
ROLL-ON->DRAPED) produce distinct correct trajectories; powerbomb/suplex/DDT/German un-stomped.
(3) "missing hands/fingers" = arm tube tapered to a nub + fingers hidden by smooth-body pass. Arm
now ends in flat palm+knuckle plate (wrist/hand/knuckle rings widened+flattened); finger+thumb
chains keepVisible over it (28/28 verified; GLB imports still hide all procedural).
SHIPPED (2K26 positions pass): `groundFacingOf(opp)` — face-UP/DOWN via verlet chest normal
(spine × shoulder-axis cross, ny sign); grounded matrix now zone×facing = 6 attacks (HEAD/BACK OF
HEAD ×1.25 / LEGS/HAMSTRINGS / RIBS/KIDNEYS ×1.12); CORNER strike family (opp._inCorner + <1.35:
KNIFE-EDGE CHOP·CORNER / SHOULDER THRUST·CORNER / MUDHOLE STOMP·CORNER, ×1.10 trapped bonus);
APRON combat family (zone mismatch over the ropes: OVER-THE-ROPE FOREARM / HOTSHOT SNAP / APRON
KNEE). MORPH DEPTH: body axes neckW/neckD/lats(V-taper, in _glute NOT _relief — size morphs must
not be definition-gated)/bicepW/forearmW/calfW/handS/footS (ringGirth); face PLACEMENT axes
faceEyeSpread/faceEyeH/faceMouthH/faceEarH (position-only in applyMesh — NEVER re-scale face segs
there, applyFighterSpec owns feature scaling: faceEars/faceEye/faceMouthW/faceLips). All in CAW.
GOTCHA: geometry probes need enterCreatePreview(0) — idle body motion (~0.19 max vert drift)
swamps morph deltas; probe the 45° cones for lats (pure-side verts don't move by design).
ALSO SHIPPED: VAULT VARIANTS — `_vaultPending.from` ('ring'/'apron'/'mid' by zone + airLift>0.45);
apron = SLINGSHOT entry (T 0.36, knees TUCK over the rope, body travels 2.6·kick into the ring,
zone flips to RING, launch 0.85, announced "SLINGSHOT <move>"); mid = quick pop (T 0.22, launch
0.75, "SPRINGBOARD <move>"); ring = classic (0.95). Verified vault2.js: 0.95/0.85+0.26 travel/0.75
+ correct announces. NEXT: corner BACK moves (opp facing buckles: back elbows/tree-of-woe from
behind); pins gated on face-UP;
arena group still has ~142 meshes (next perf brick); wire CHAR_FINISHERS into MOVESET_DB; harvest
STUDIO clips from godmode/BANNON_AAA_v21_2K_mocap_2.html + feed assets/mocap clip into poseGrabbed
LIFT/CARRY slots (READ docs/mocap_orientation_master_prompt.md FIRST — binding).

## Match engine (v152 — the "coming soon" catalog went live)
- Combat readability fixes: per-frame BODY SEPARATION for standing pairs (gap 0.46, skips
  grapple/held/down/air pairs — merged-bodies was THE "can't tell what they're doing" cause);
  receiver GIVE-GROUND per hit tier (0.04/0.09/0.16 ×kbF); AI now drives EVERY non-player fighter
  (was hardcoded fighters[1] — CPU P1 stood idle; multi-man needs this).
- v152 MATCH RULES + MULTI-MAN block (end of file): opponent() = nearest-living when >2 fighters;
  TRIPLE/FOURWAY/ROYALE spawn extra AI entrants from BANNON_ROSTER (dressFighter+morphs applied,
  mini HP bars top-center); declareWinner wrapper = elimination flow (KO'd are ELIMINATED, match
  runs until one stands). LMS = ref 10-count over any downed fighter (hp<55%); FIRSTBLOOD wraps
  __spawnBlood (nearest-fighter attribution, bleeder loses); SUBMISSION = sub-minigame success sets
  hp 0 "TAP OUT" (edit at the sub-success branch); IRONMAN = 180s round in startRound; ANYWHERE/
  HARDCORE = official (pins/subs were never zone-gated, no DQ system exists). MATCH_TYPES live flags
  updated in the char-select block. Still 'soon': TAG, LADDER/TABLES/TLC/CAGE (need props), GAUNTLET.
- GOTCHA: `let fighters` (line ~1646) — window.fighters is UNDEFINED; late script blocks must
  reference the bare lexical `fighters` (typeof-guarded), not window.fighters.
- v153 ENV CONTACT: ring posts are live impact surfaces (120ms interval: sampled velocity > 1.9
  toward a post within 0.62 -> velocity-scaled damage + wobble + stumble/knockdown + "INTO THE
  POST"). Steel steps join when the 3MF prop converts. Verified: fling into corner = −56hp, ragdoll.
- v153 ARENA PERF: 96 rope segments -> ONE InstancedMesh (unit cylinder, verlet solver composes
  instance matrices at ch.segBase+i); 12 turnbuckle pads + 12 connector rings instanced (baked once).
  Visible meshes 240 -> 120. Rope sag/bow physics unchanged (BANNON_ROPES.update).
- v153 FINISHERS WIRED: `window.FINISHER_MOVES` (by roster key) — full momentum + power-mod +
  SPECIAL = the character's NAMED finisher. kind 'grapple' auto-runs grab -> named GRAPPLE_POSITIONS
  lift -> timed grappleDeliver through the REAL physics (no canned path); kind 'strike' = named
  100-power shot. Canon names from the OTTR cast table (GETBACKK, THE OPTIMIZATION DRIVE, THE
  HOSTILE TAKEOVER, THE INDEFINITE SUSPENSION=gorilla press, THE CRUCIBLE, LION'S ROAR...).
  **BANNON's "EXECUTIONER'S DROP" (CROSS_POWERBOMB) is a PLACEHOLDER — owner names it later.**
  Verified fin.js: FINXSSE GETBACKK announces -> FIREMANS_CARRY st2 -> auto-delivers to ragdoll.
  Sub-type finishers (Anaconda Vise etc) + dive finishers (frog splash) still route as
  spike/strike — proper sub/dive wiring queued.
- v154 FULL CANON CAST: `_addChar` now AUTO-SEEDS a MOVESET_DB stat block + ROSTER_SPEC style from
  the meta.archetype (`_ARCH_STATS` map: powerhouse/brawler/striker/technician/highFlyer/freeAgent)
  — previously _addChar only wrote CHAR_META/attire/body so canon chars WITHOUT a hand-written
  MOVESET_DB entry were INVISIBLE in ROSTER_ALL (which iterates MOVESET_DB). Added ~24 canon fighters
  from the OTTR cast table (Alliance: Atlas Vance/Chief Red Cloud/Lion of Punjab/Lady Rhiannon/Agent
  Canuck/Celtic Fury/Rey Fuego/El Toro de Oro; Corporate: Cain Elias/Astrid/Shaolin Shadow/Finn Mac/
  Ghost of Lahore/Masato Iida/Hikaru Arashi/Kenji Saito/Kiko Tanaka/Ryuji Tatsu/Finance Demon/Zenith;
  Agents/Indies: Cassian Thorne/Mr Zero Point/Great White North/Sombra Negra/Raja) + their canon
  FINISHER_MOVES. Read the full cast doc ("Off The Top Rope cast and characters .txt", 41-char
  master roster) — added the last 4 AWE assets (Cold Frost/Grixf/Machine Tiger/Chainmail) so the
  in-game canon matches the books. `window.CHAR_MANAGERS` registry seeded (Cody "Corduroy Kid"
  Callahan — canon manager, momentumTrickle+interfere; slot-menu manager pick + interference wiring
  queued). Verified: ROSTER_ALL 51 (43 canon), all new cast selectable. THE CANON 41 (books) =
  Kennedy/Combs (owners), Marquis=BANNON (protagonist), Atlas Vance, Cassian Thorne, Cain Elias,
  Cody Callahan (manager), Zenith, Cold Frost, Grixf, Machine Tiger, Chainmail, Tightrope, Finxsse,
  Stick-Up, Mr Zero Point, Masato Iida, Hikaru Arashi, Kenji Saito, Kiko Tanaka, Ryuji Tatsu,
  Finance Demon, Shaolin Shadow, Finn Mac, Ghost of Lahore, Astrid, Heath (London Broker),
  Captain Unity, Great White North, Chief Red Cloud, Lion of Punjab, Lady Rhiannon, Agent Canuck,
  Celtic Fury, Rey Fuego, El Toro de Oro, Akon, Yorkshire Grit, Raja, Sombra Negra. Factions:
  Alliance / Corporate Structure (AWE+JPCW) / Agents of Chaos&Temptation / Independent Variables.
  Companies: AWE (Kennedy) + JPCW (Combs's global network).
- v154 FLAIL FIX ("feet and limbs fly around crazy when hit" — owner's constraint-solver diagnosis
  was correct): (a) visceralImpact (Rapier path) VMAX 6.5->4.5 + per-hit damping spike (lin 0.5/ang
  0.7 for 0.5s) + head/struck-node vertical share cut (whip BACK not UP); (b) POST-CONSTRAINT VELOCITY
  CLAMP in the verlet updateRagdoll — integrate()'s cap runs BEFORE the 15-iter bone solver, so
  constraint corrections re-inflated implied velocity (pos-old) uncapped = the flail; now clamped to
  MAX_BODY_VEL*h AFTER the solve by pushing `old` toward `pos`; (c) POISE-DRIVEN MOTORS: currentRagMotor
  now ×(0.55+0.45·poise) — stiff upright at high poise, limp drop when poise breaks (heavy terminal
  reactions, not spring-back jiggle).
- v154 MENU SLOT FLOW (owner: "tap ur slot then choose, don't force selecting both"): assign() NO
  LONGER auto-flips sides — you tap the slot (P1/P2/P3/P4) then pick characters freely. TRIPLE/FOURWAY/
  ROYALE reveal P3/P4 mini-slots under the plates (MULTI_TYPES map), feed MATCH_SETUP.p3Name/p4Name,
  and the multi-man spawner uses those picks first (randoms fill the rest). Verified: tap P1 -> pick ->
  P1=BRUTUS stays on P1; TRIPLE shows P3:RONIN slot. Spec items still queued: per-slot attire/payback/
  manager context, taunts (crowd/opp/wakeup), daze meter, LB interact button.
- v154 (owner control spec drop -> docs/controls_and_mechanics_spec.md, BINDING for control work.
  RULE: build ON TOP of existing controls, never replace — e.g. reversal lives on the existing
  DODGE/REV button, NOT a new Y button): 2K REVERSAL — tap DODGE/REV (or Shift/H) inside the
  incoming strike's windup (phase 0.06-0.42, range<1.9): attack cut, attacker stumbles+poise−28,
  defender +16 momentum, "◇ REVERSE!" prompt projected over the player's head during the window,
  mistimed tap = 1.1s lockout, AI defenders roll reversals from stamina (5-11%). STUN MASH-OUT —
  while down, any action button tap shaves downTimer 0.14 (yellow SVG ring gauge over head).
  SIGNATURE->FINISHER BANK — MOD+jab at 50+ momentum = named signature (CHAR_FINISHERS.sig),
  −50 momentum, banks a finisher (max 3); MOD+special spends a banked finisher below full meter;
  momentum gains below 50 boosted ×1.5 (sig meter fills 50% faster). Verified rev2.js: REVERSAL!,
  stumble, cooldown block, mash 2.5->1.66, SIGNATURE[BANKED] 60->10 mom bank 1, banked finisher
  fires EXECUTIONER'S DROP at 10 momentum. Spec items still queued: taunt set (crowd/opponent/
  wake-up ×4+MOD variants), daze meter (purple, longer than stun), 5-slot sig/fin move pickers,
  contextual LB interact button, floating left joystick, surface-matrix extension (tables/barbed
  wire/tacks/glass/trashcan), squash-vs-epic match pacing options.
- MOCAP HARVEST FINDING: BANNON_AAA_v21_2K_mocap_2.html has the SAME MoveNet-Thunder webcam
  recorder v150 already has — its clips live in the OWNER'S browser localStorage (STORE_KEY), not
  the file. The real harvest = convert assets/mocap/mocap_data_partial.json (144-joint two-fighter
  AlternatingForearms) into STUDIO.clips format — needs the 144->rig joint map, READ
  docs/mocap_orientation_master_prompt.md first. QUEUED as its own focused brick.
- Verified mm.js/lms.js/fb.js: 3-man spawns (BANNON/FINXSSE/RONIN), AI brawls, elimination
  continues match, last-standing ends it; REF COUNT announces; FIRST BLOOD ends w/ bleeder hp 0.

## MODEL GAP ANALYSIS (owner demand 2026-07-05: "no bullshit, why are ours so far off 2K/UFC/FN")
Honest technical audit of the procedural body vs WWE 2K26 / EA UFC / Fight Night models:
1. **Mesh density/topology**: ours ≈3.6k verts of swept tubes; theirs 40-80k+ sculpted meshes with
   edge loops following musculature. Tube cross-sections can't crease at elbows/knees, can't make a
   scapula, pec-delt tie-in, or knuckles. Gaussian relief on a tube has a hard ceiling.
2. **Face**: ours = primitive nose/mouth boxes + sphere eyes on a tube head + relief bumps; theirs =
   scanned/sculpted heads, 50+ blendshapes, real eyeballs (cornea/iris shader), teeth, lashes.
3. **Skin**: ours = 512px procedural mottle + Sobel normal; theirs = 4K scanned albedo/normal/spec,
   pore-level detail normals, SSS, per-region wetness. (Our sweat roughness ramp is the right idea.)
4. **Hair**: cap mesh + cylinder dreads vs alpha hair cards w/ anisotropic spec.
5. **Attire**: vertex-paint regions vs real cloth meshes w/ wrinkle normals + logos.
CONCLUSION (confirmed by audit): the procedural body CANNOT reach 2K by more gaussians — topology
deficit is mathematical (morph targets are linear vertex translations; if the vertex isn't there,
the math does nothing; a 12-vert joint ring collapses like a straw when bent). It is the
fallback/CAW-preview/low-poly-"retro-attire" tier. **AAA PATH PROVEN THIS SESSION** (v154): the
Action Adventure Pack X Bot FBX -> GLB (fbx2gltf, binary) -> `assignCharModel('BANNON', url)` loaded
end-to-end through the EXISTING import path: 65 bones bound, 2 SkinnedMeshes, **28,374 verts** (8x
the procedural body), procedural mesh auto-hidden, model follows the fight rig. Banked to
`assets/models/xbot.glb` (+ idle/walk/run clips in assets/models/anims/). fbx2gltf binary lives at
scratchpad `node_modules/fbx2gltf/bin/Linux/FBX2glTF` — headless conversion works in-sandbox, no
Blender needed for the convert step.
THE RUNTIME-CAW WORKAROUND (owner's architecture, the way to get 2K-level authoring WITHOUT saving a
GLB per character): author ONE 40-80k male + one female BASE mesh in Blender with anatomical edge
loops (deltoid/pec/knee/elbow loops that slide+compress on bend) + universal UV + 50-60 FACS/body
shape keys, export ONE base GLB (Draco + KTX2). Then in-engine: (1) UI sliders -> `mesh.
morphTargetInfluences[i]` (GPU morph targets, ~zero CPU, stack 60+); (2) height/proportion ->
`skeleton.bones[i].scale` with a collider-recalc callback; (3) skin/tattoo/scar -> OffscreenCanvas
composite into ONE CanvasTexture; (4) SAVE = a lightweight JSON "DNA payload" (slider vals + bone
scales + tex IDs), NOT a 3D file — the engine spawns the base GLB and injects the DNA at match start.
The morph->slider bridge + CHAR_MODEL binding are already live; what's missing is the authored base
mesh (Blender-MCP task) and the DNA-payload save/load schema. Near-term procedural wins (won't close
the gap, still worth it): 1024px skin tex w/ pores+veins, real eyeball meshes, hair-card dreads,
cloth wrinkle normals, elbow/knee crease rings.
ENGINE PIVOT (owner floated UE5/Unity): logic (MAX_HP 10000, DMG_SCALE, MAX_BODY_VEL 3.8, poise-
driven crumple) translates 1:1 (cannon/verlet->PhysX/Chaos, JS->C#/C++). Keep the Three.js procedural
models as low-poly retro/"training dummy" unlock attires. Decision deferred — prove the GLB pipeline
fully in Three.js first (DONE for import; DNA-CAW schema next).

## DNA-CAW schema (v155 — the runtime-CAW payload, the last piece before a native port)
- `window.BANNON_DNA` (capture/apply/export/import/save/load/list/remove): a character saves as a
  ~0.5KB JSON RECIPE (morph sliders + bone-scale + palette/attire/identity), NOT a 3D file. Engine-
  agnostic: `shape` drives the procedural body now; pre-split `morphs`/`boneScale` map 1:1 onto a base
  GLB (`morphTargetInfluences` + `skeleton.bones[i].scale` + OffscreenCanvas texture) and onto UE5/
  Unity. `BONE_KEYS=[height,armLen,legLen,torsoLen]`→bone.scale, everything else→morph targets. SAVE
  DNA / LOAD DNA / EXPORT / IMPORT buttons in the CAW panel. Verified dna.js: capture splits 7 morphs
  + 2 bone keys, 499-byte export round-trips onto a DIFFERENT fighter exactly, localStorage save/load
  works. Schema contract = `docs/DNA_SCHEMA.md`. Native port map = `docs/PORT_MAP_native.md`.
  CODEDUMMY capability/anti-amateur-mistake spec = `docs/CODEDUMMY_capability_spec.md`.
- ENGINE PIVOT PLAN: finish/validate DNA-CAW in three.js (DONE) → author base male/female GLBs w/
  FACS BlendShapes (Blender-MCP) → port to UE5/Unity via PORT_MAP (logic is 1:1, physics laws carry
  verbatim). Three.js procedural models become low-poly retro/training-dummy unlock attires.

## Model fidelity pass (v155 — deepen the procedural body, don't just defer to GLB)
- MESH DENSITY: N (radial) 20->28, SUB (longitudinal) 4->7 — body verts 3594 -> 8638 (2.4x),
  rounder cross-sections + finer taper + more morph-target resolution for joint bends. Live knobs
  `window.BBODY_N` / `window.BBODY_SUB`. Crowd instancing (v152/153) freed the budget for this;
  8638×2 fighters is trivial on a real GPU (harness swiftshader FPS is not a real perf signal).
- ANATOMICAL MUSCLE RELIEF (leverages the new density, in `_relief`, gated by _def=muscularity·lean):
  arms = deltoid cap (rr~0.10) + biceps belly (front rr~0.42) + triceps horseshoe (back rr~0.44,
  ×cos(2a) twin-ridge) + forearm flexor (rr~0.72); legs = quad sweep (front rr~0.22) + hamstring
  (back rr~0.20) + gastroc twin heads (back rr~0.66 ×cos(2a)) + tibialis ridge (front rr~0.66).
  Verified: TITAN at musc 1.0/fat 0.12 shows visible pec/ab/limb muscle shapes (was a smooth tube).
- HONEST CEILING still true (procedural tubes ≠ 40-80k sculpts) BUT the owner is right that the
  procedural body was under-built — these are real visible wins within the tube system. The GLB/
  DNA-CAW path (proven X Bot import + documented runtime-CAW architecture) remains the AAA endgame.

## v156 pass (models + combat + grapple, all harness-verified, sentinels added 22->28)
- JOINT CREASE RELIEF (`_relief`, sentinel 'ELBOW CREASE'): elbow flexor groove + olecranon rise (arms
  ti3/4, rr~0.50); knee popliteal groove + patella cap (legs ti5/6). Limbs FOLD at a hinge, not straw-
  collapse. Def-gated => all procedural chars. Verified relief maxDelta 0.114.
- AAA BASE BODIES IN LIBRARY (sentinel 'Wrestler Base (AAA)'): `assets/models/wrestler_base.glb` +
  `xbot.glb` opt-in MODEL_LIBRARY entries, driven by CAW/DNA via applyShapeMorphs. NOT default (bases
  untextured — texturing them is the next step to make one the default AAA body).
- HIGH-END AERIAL CATALOG (DIVE_TYPES, sentinel 'HIGH-END AERIAL CATALOG'): +8 dives (Shooting Star/
  Phoenix/450/Imploding 450/Spiral Tap/Tornillo/Diving Leg Drop/Double Stomp; 16 total). Auto-listed in
  Dive Lab editor. spin snaps to clean rotations on landing, no over-rotation.
- CORNER BACK ARSENAL (playerAttack corner branch, sentinel 'CORNER BACK vs FRONT'): opp facing INTO the
  buckles (forward()·dirToAttacker<0) => BACK ELBOW / FOREARM·KIDNEYS / TREE-OF-WOE STOMP; front keeps
  the chops. Routes through startAttack (no new pose authoring).
- STRUGGLE-LIFT (poseGrab PD block, sentinel 'STRUGGLE-LIFT'): physics teeter — S=f(mass margin,stamina);
  high S => forklift stack rocks fwd/back, sags toward dropping on the down-beats (compound sine: fast
  tremor + slow near-drop swell) then surges back up, spine flexes under grind / extends at apex, knees
  buckle when slipping. Strong/fresh => S~0 clean. NO minigame (veto respected). Verified: featherweight→
  GOLEM gassed S 0.68→0.94, carry 10cm fwd/back rock + 10 dir-flips + 7.5cm vertical sag/surge.
- ANY MOVE FROM ANY POSITION (sentinel 'resolveGrapPos'): `window.resolveGrapPos(move)` maps an equipped
  moveset entry -> GRAPPLE_POSITIONS key (tag->key->label->fuzzy->STANDARD); wired into the signature +
  finisher grapple paths (+rear/front mode + lift0 + liftDur). Equip 'German Suplex' as finisher => real
  German (grapplePos=BACK_SUPLEX, mode=rear). MOVE LIBRARY editor already allows any move in any SIG/FIN
  slot (5+5 caps) grouped by position — this closes the COMBAT side. Verified 8/8 mappings.
- STILL QUEUED (owner's list): 1024px skin (pores+veins+region masks); texture the base GLB -> make it a
  default AAA body; deepen grapple IK 'connect' further (grip contact welds); expand positions to Steve
  Masson/2K depth; WWE-2K editor VISUAL layout polish (CAW + moveset UI). procedural body + GLB both live.

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

## MODEL OWNERSHIP DIRECTIVE (binding — owner set 2026-07-12, do NOT ask again)
Who generates which character models, so the agents never wait on or duplicate the owner:
- **OWNER makes (agents NEVER auto-generate these):** every BOOK/canon character (the 41-canon roster
  — Bannon/Maime/Solaris, Atlas Vance, Cassian Thorne, Cain Elias, Cody, Zenith, Finxsse, Stick-Up,
  Tightrope, the JPCW/AWE rosters, etc.) AND **Onyx's game-only stable: CIPHER, ECHO, STATIC, HOLLOW,
  ONYX, and "the other Onyx teammate"** the owner is still designing. Owner uploads these to the Drive
  folder; the pipeline auto-skins + banks them but does NOT invent them.
- **AGENTS make (auto-generate + auto-attach freely):** characters that appeared ONLY in the GAME and
  NEVER in the books and currently have only procedural three.js bodies — **VIPER, KAGE, BRUTUS,
  ZEPHYR, MORTUS, RONIN, TITAN, GOLEM** (arena/test fighters, unclaimed by canon). Generate via the
  Tripo/forge pipeline (tools/tripo/), auto-skin (tools/rigready/skin.cjs v4.2), bank to
  assets/models/, wire into MODEL_LIBRARY + CANON_MODELS.md, verify with the harness.
- Curated generation prompts for the agent-made set live in `tools/tripo/gen_prompts.json`. When in
  doubt whether a character is owner's or agents', it's the OWNER'S — do not generate.

## bannonengine_2.zip verdict (2026-07-12 — full audit in docs/bannonengine2_integration.md)
The AI-Studio "CAW Suite" drop: ~60 C++ files, ALL cout-narrative stubs (print the physics, compute
nothing); IK service = np.random; bundled HTMLs older than live; weight-clamps Kt = derivative of
our v4.2 skinner. REAL implementations extracted+landed: `native/include/bannon_referee.h` (LoS
pin gating w/ occluders, lateral whip avoidance, refBump w/ own HP/poise pool, pinKickout count
tiers, submissionStep torque→limb-HP organic tap) + `native/include/bannon_universe.h` (traitMods
subtype overrides CLAMPED to MAX_BODY_VEL — their version broke the cap, vetoed; tableImpact 350N
shatter, canBindLadderClimb, ironManFallReset 35%+5%/fall wear, crowdReaction, scoreShow booking
math, PoliticsState shoot-AI/slow-counts, matchConsequence injury→strip-titles→revenge-seed).
ctest now 8/8 suites. The one real code asset — the REALITY CHECK glitch shader — is live in the
composer after BROADCAST_GRADE: `window.triggerRealityCheck(intensity[,holdSecs])` w/ auto-decay
(verified: full inversion+RGB-split at 1.0, decays clean). JS wiring queue: referee entity in the
match scene, submissionStep into the sub-minigame branch, TLC props when meshes land.

## v157 pass (2026-07-13 — referee entity + physical submissions + mocap plan + env refs)
- **BANNON_REF** (end-of-file script block): the referee as a physical entity — zebra-shirt
  procedural body, roams off the action midpoint, ports native bannon_referee.h laws to JS:
  LoS cone + body-occlusion pin gating (`BANNON_REF.canCount(victim)`), lateral whip avoidance,
  ref bumps (fast body <0.5m → down 2.5+v·1.8s, counts suspend, "REF BUMP"). startPin's count
  only advances while `canCount` (announces REF CAN'T SEE IT / NO REFEREE once per stall);
  `window.__refPin` set/cleared at pin start/3-count/kickout drives his count positioning+arm.
- **PHYSICAL SUBMISSIONS** (_v77StartSubmission, non-PIN path): native submissionStep model —
  crank(momentum) vs resist(stamina) → joint rot past 1.2 limit → local limbHp drain → ORGANIC
  tap (limbHp 0, or strain>0.92 w/ gas<6%); hold-local stamina pool (no regen mid-hold, engine
  stamina clamped down each tick); strain>0.75 shrinks the escape zone; zero-strain holds at the
  4.4s ceiling = "POWERED OUT" (no damage). Verified: gassed taps ~2.5s hp→0; fresh powers out.
- **REAL-TIME CLOCKS**: sub + pin counts now advance on measured wall-time (capped dt), not tick
  counts — under CPU load setInterval stretches (harness swiftshader 2.3Hz!; weak phones too) and
  tick-count models stretched holds/counts with it. Same lesson class as the v152 crowd-lag fix.
- **HARNESS GOTCHA (recorded in bannon-verify)**: freecamEnter() is the CAW MODEL-VIEWER — it
  HIDES ringProcGroup + all other fighters BY DESIGN. Every "ringless void" screenshot ever taken
  through it was this. Env/match shots: `FREECAM.on=true; freecamTarget=()=>null;` — never call
  freecamEnter. Also renderer.info.render only shows the last composer pass (1 call/1 tri ≠ broken).
- **ENV REFERENCE SET**: assets/reference/env_snapshots/ (14 shots, styled + clean-bloom) + README
  brief + tools/tripo/gen_prompts.json env_* prompts — the Tripo image seeds for the environment
  upgrade. Ring GLB should come WITHOUT ropes (verlet ropes stay procedural).
- **docs/mocap_accuracy_plan.md** (BINDING): FBX clips = accuracy reference for authored grapple
  phases (clip-sample at phase boundaries → diff → correct direction then magnitude, orientation
  master prompt first); RagdollBlendMatrix spine-release, EmergentBotchMatrix hard-sever,
  velocity-clipped dives, modes matrix (2K BroadcastEventMatrix / Tekken story splines / GM math /
  God Within RPG) distilled from the owner's long-updates txts.
- HALL_NIGHTER (Book 6 Showstopper) + STATIC 'The Interference' (Onyx stable, Enzo-model) live:
  skins banked, identities, finishers (THE CURTAIN CALL / DEAD AIR), STATIC bind verified in-ring.
  New owner models ~970k verts — decimation pass on skinner output QUEUED (phones will feel it).
- TLC props: table/ladder meshes still not in Drive — native tableImpact/canBindLadderClimb ready,
  JS wiring waits on meshes.

## v158 (2026-07-13 — models fight for real: auto-load + the leg-collapse fix)
- **GLB MODELS AUTO-LOAD IN-GAME** (owner: "tired of seeing the three.js models"): `CHAR_MODEL_DEFAULTS`
  seeds every canon char that has a banked skinned GLB, so picking them = fighting AS the AAA model,
  not the procedural tube. `charModelFor()` = user-saved binding wins, else the canon default;
  `window.AUTO_CHAR_MODELS` toggle. applyCharModels() already ran at match start — the registry was
  just empty. Verified: BANNON + HALL_NIGHTER auto-bind + fight as their GLBs.
- **ROLL-STABLE LIMB AIM — the "spiral-collapse leg" fix** (`_aimLocal`, `window.STABLE_LIMB_AIM`):
  the GLB retarget drove each limb with `setFromUnitVectors(restFwd, targetDir)`, whose roll about
  the aim axis is UNDEFINED — near-vertical leg targets flipped the wrong way (verified: left thigh
  curFwd z=+0.25 while its target was z=-0.20; mirror-symmetric right leg tracked fine → a handedness
  bug). Fix: build FULL orthonormal frames for rest-fwd and target-dir sharing ONE up reference (the
  world axis least parallel to the aim) so the roll is deterministic. Applied to limbs only (spine/
  neck/head keep the working path). The raw skinned GLBs were always perfect (model_preview proved
  it) — the jank was 100% this engine retarget. Verified: HALL_NIGHTER legs went from a dark spiral
  spike to coherent jeans+boots; BANNON un-regressed.
- WEAPONS + CLONED MOVES live (see prior commit): 6 owner weapon GLBs (native bannon_weapon.h laws),
  cloned-move library entries routed through resolveGrapPos + real physics.
- STILL QUEUED: decimate the ~1M-vert owner models (phones will choke) — the skinner needs a
  quadric/cluster pass on output; STATIC's GLB sometimes still on the procedural body (80MB parse
  race — auto-load only fired p1 in one test); onyxstraightjacketskirt Drive upload still truncated.

## CHARACTER GENERATION RULES (binding — owner set 2026-07-13, do NOT repeat back)
When agents generate models/attire (tools/gen/hf_pipeline.py, tools/tripo/*), obey ALL of these — they
also live in tools/tripo/gen_prompts.json `_rules`:
1. **NO trademarked logos.** Never put real brand/promotion marks (WWE/AEW/Nike/etc) on anything. If a
   logo motif is wanted, invent a PROPRIETARY Bannon-universe emblem based on the idea; otherwise leave
   gear blank. Always modify any logo-like thing to something original to our universe.
2. **Coherent attire ONLY.** Believable pro-wrestling gear — NO nonsensical pieces (weird suspenders,
   nipple straps/attachments, floating bits without context). Everything must have a real rationale.
3. **Ethnicity is identity.** Generate the character's specified race + skin tone; keep the roster
   diverse. Locked so far: VIPER, ZEPHYR, GOLEM = Black (various tones). Owner names others as we go.
4. **Semi-realistic LIKENESS.** WWE 2K / Fire Pro / sim-game fidelity that matches the character's
   gimmick, fighting style, psychology, and race — grounded athletes, NOT cartoon superheroes.
5. **Clean seed pose.** Full-body front-facing symmetrical A-pose, plain flat white bg (image→3D seed).
FREE GEN PATH: `HF_TOKEN=<bannon agent key> python3 tools/gen/hf_pipeline.py [NAME…]` — text→image
(Qwen/FLUX, works) → image→3D (Hunyuan textured / frogleo geometry) → auto-skin v4.4 → bank. The
token gives ZeroGPU queue priority (anonymous = "no GPU"). Hunyuan /generation_all 500s intermittently
(textured); frogleo gives untextured geometry — texture quality is the tuning gap to close.
The FIRST AI DRAFT of all 8 (milestone) is archived at assets/reference/agent_fighters/draft1_first_ai/.

## WWE-STYLE CREATION SUITE (owner spec 2026-07-13 — BINDING target for the UE port)
The full creation suite must look/feel like the WWE 2K menus down to layout + contents:
- **Superstar creation** (CAW): the 2K create-a-wrestler flow — body/face morph, attire layers,
  materials/logos (proprietary only, rule #1), paint, hair, entrance gear vs ring gear.
- **Arena creation**: ring, apron, **barricades**, **ramp**, **trons + mini-trons + Titantron**,
  stage/entrance set, crowd/bowl, lighting — an arena EDITOR (place/scale/skin parts).
- **Moveset creation**: per-position move slots, signatures/finishers, the 2K moveset editor layout.
- **Entrance creation**: entrance video/tron, pyro, lighting, music, motion timeline.
Build these as UE UMG screens mirroring the 2K menus (layout + contents), backed by the native DNA/
moveset schemas. Tracked in unreal/CONVERSION.md.

## v160 pass (2026-07-18 — freeze/deform fixes + APK + jukebox + universe layers, ALL harness-verified)
BINDING session memory so these don't get re-derived:
- **MODEL "DEFORMATION" = HANGING DREADS RENDERED AS VERTICAL SPIKES (FIXED).** The owner's "all models
  deformed / bones stretching" was the hanging-dread branch (~line 6721) setting `d.rotation.set(0,0,0)`
  — a Cylinder's default axis is +Y, so every loc stood as a VERTICAL cylinder clustered at the skull (a
  picket-fence of head-spikes) on EVERY dreaded char. FIX: orient each loc to DRAPE (quaternion
  setFromUnitVectors(+Y, hangDir), hangDir=(-0.16,-1,0), back arc 115–245°, top anchored at the scalp).
  DIAGNOSIS METHOD (reuse): harness close-up (FREECAM.on=true; FREECAM.tx/ty/tz/dist on the fighter,
  DON'T call freecamEnter) + hide sub-meshes one at a time (seg.dreads/seg.hair) to isolate. Body geometry
  (`_bgeo`) measured clean the whole time — the deform is always in a SEPARATE sub-mesh (hair/dreads/gear).
- **GAME-FREEZE AFTER CHAR SELECT = a missing `</script>` from a main merge.** A merged block ended `})();`
  with no `</script>`, so the browser threw "Unexpected token '<'" and a whole block of Fighter.prototype
  methods never defined → fight loop threw every frame. ALWAYS run the harness (build.cjs → real browser
  pageerror check) after merging main; the naive `<script>` regex FALSE-POSITIVES on `<script>` strings in
  the God-Mode builder data (main carries a 1-tag imbalance that is browser-harmless).
- **APK BUILD RECIPE THAT WORKS IN-SANDBOX (no UE):** `android/` WebView project + Android SDK 34
  (`dl.google.com` cmdline-tools → sdkmanager platform-34/build-tools;34/platform-tools) + **JDK 17**
  (Java 21 breaks AGP 8.1's jlink JdkImageTransform — get Zulu 17 from `cdn.azul.com`, NOT github which is
  proxy-blocked) → `gradle -p android assembleDebug -Dorg.gradle.java.home=<jdk17>`. Output
  `android/app/build/outputs/apk/debug/app-debug.apk` (~3.7MB, bundles the game, streams models). SHIPPED
  the APK to the owner via SendUserFile. `.github/workflows/android.yml` does the same in CI (java 17).
- **MOVE LIBRARY (2K-level) — `assets/moves/bannon_move_library.json` + `window.BANNON_MOVE_LIBRARY`.** 53
  moves by position×style, each mapped to a real GRAPPLE_POSITIONS/DIVE_TYPES key → routes through
  resolveGrapPos into OUR physics. NEXT (owner's standing ask): map the **202 FBX clips in assets/mocap/(drive/)**
  (loaded via BANNON_LOAD_FBX_LIBRARY → STUDIO.clips) onto library entries; add wake-up / running-corner-to-
  grounded-opponent / secondary+tertiary positions; fold MDickie moves_catalog (tools/bbparse/out) in with
  our physics. Legibility = animation pass on top of this catalog.
- **SURROUNDING GAME (`window.BANNON_UNIVERSE`)** — career/booking + promos/allegiance/turns + tag teams +
  contracts/free-agency + rankings + tournaments + rivalry graph + expanded LLM contract negotiation +
  promo battle, 3 promotions (AWE/JPCW/NWC), full ROSTER_ALL. Verified headless. UI (a hub tile) is next.
- **JUKEBOX (`window.BANNON_JUKEBOX`)** — 16 owner tracks in assets/audio/ (WAVs→OGG via soundfile block-
  stream), menu/match/entrance/victory, IndexedDB "add more". Main-menu music bar. NPC Finxsse merged INTO
  Finxsse as an attire (not a separate char). Creation-suite subsystems moved to a MAIN-menu 3×3 hub (out
  of the pause menu). PWA manifest + icons (installable). Lyra: owner pushes it to a private mhvnsnt/lyra
  (docs/LYRA_ACCESS.md), then add_repo + integrate (docs/LYRA_BASE.md).
- **IMPACT-TAUNTS (WWE-2K style, LIVE)** — capoeira (Ginga/Esquiva/Capoeira), breakdance SPINAROONY family
  (Breakdance Footwork/Freezes), and showman taunts (RapidChestBeating/ButtSlap/ViolenceParty) are BOTH a
  taunt AND a real strike. Contract in `assets/moves/fbx_move_map.json` (`dualPurpose:true`+`altKind`+
  `altEngine`; `_dualPurpose` header note) — 15 dual-purpose clips. `BANNON_MOVE_LIBRARY.tauntOrStrike(clip,
  oppInRange)` picks the mode; `impactTaunts()`/`isImpactTaunt()` added. `window.performTaunt(dir)`
  (up=crowd/down=disrespect/left=ginga/right=spinaroony) routes strike-mode through the SAME startAttack→
  registerHit physics (no canned anim). Wired to the touch TAUNT CLUSTER (4 dirs) + keyboard `t`+direction.
  Verified: in range GINGA→phase 0.52, hitConnected, −155hp; out of range→+8.8 momentum, 0 dmg.
  GOTCHA (harness): a prior KO ends the match → gameState leaves 'fight' → the loop stops stepping poseAttack
  → next trial's attackPhase frozen at 0. Reset opp.hp=maxHp + gameState='fight' (or run the trial first).
  Also strikes run in SLOW MOTION at the harness ~2.3fps (dt pegged 0.05) — wait multiple seconds, don't
  misread as "attack never fires". Also the internal hit call is the LEXICAL `registerHit` (line ~9889), NOT
  `window.registerHit` — wrapping window.* to spy on hits is a no-op; measure opp.hp/hitConnected instead.
- **GOOGLE AI STUDIO src/** — AI Studio mirrors a 35-file React companion app under `src/` to main (creation
  suite/AI chat/GitHub-sync dashboards). It only ADDS to src/; it has never deleted game files, canon, or
  assets/moves. When it says it "removed the daemons," that's cleanup of its own sync scripts, not our code.
  It also does NOT add characters to the playable game — its Dashboard.tsx had only a 7-char demo list.
  Merged-branch protocol: this branch is fully contained in main — fast-forward onto origin/main and keep going.
- **v160 BOOK CAST (50 chars + 14 stables added to the GAME roster)** — the owner's missing-character list
  (Judas Messiah/The Saint/Vain Abel/The Bad Gal/Slime&Prince/Matador/Phoenix/Slick Willy/Bash Bros/High
  Rollers/Air Jordan+Tank Shackle/Kid Glide/Iron Tusk/Hardcore Harry/Luchador Twins/Corporate Auditors/
  Repetition/Thinker/Velocity/Cubist/General Vance/Pretty Flacko/Club God/Coven of Gnarly ×6/Degenerates/
  NWC/Dynasty/Masterpiece/Straight Shooters/Hollywood/Ronald Slump+Jr) wired via `_addChar` (CHAR_META +
  MOVESET_DB + ROSTER_SPEC from archetype) with faction+stable+proprietary bio, proprietary FINISHER_MOVES,
  and a new `window.CHAR_STABLES` registry (14 stables, members = roster keys). Verified: all 50 in
  MOVESET_DB/CHAR_META/FINISHER_MOVES, ROSTER_ALL()=116, 0 pageerrors. Models stay procedural until real
  skinned GLBs exist — identity/roster first (owner makes canon models per the ownership directive).
- **v160 SURROUNDING GAME + COMBAT (this pass, all harness-verified):**
  - **CARRY vs INSTANT grapples** (`window.isInstantMove`/`moveCarry`/`execGrappleMove`, near resolveGrapPos):
    carry moves (powerbomb/DDT/fireman's/piledriver/suplex/chokeslam/gorilla press) lift+hold then deliver;
    INSTANT moves (stunner/cutter/RKO/neckbreaker/bulldog/x-factor/legsweep/snapmare) skip the hoist —
    craneLift 0, grappleStage 3, _liftMinT 0, snap to a fast 'spike'. Honors an explicit `move.carry` flag
    first, else name/pos pattern. Finisher + signature grapple paths route through execGrappleMove (no
    lockup — straight to hoist/delivery, WWE-2K style). `resolveGrapPos` now honors `move.pos` first.
  - **MDickie MOVES in full** (`assets/moves/mdickie_moves.json`, gen `tools/bbparse/gen_mdickie_moves.cjs`):
    75-move vocabulary from the .bb catalog → proprietary names → our physics via resolveGrapPos (9 authored
    GRAPPLE_POSITIONS: STANDARD/POWERBOMB/CROSS_POWERBOMB/VERTICAL_SUPLEX/DDT/BUTTERFLY_DDT/CHOKESLAM/
    BACK_SUPLEX/FIREMANS_CARRY; others fuzzy→STANDARD). Folded into BANNON_MOVE_LIBRARY pools.
  - **`window.BANNON_STORY`** — entrances/victories (hooked into startFight/declareWinner), 7 backstage areas +
    meetings, branching dialogue (respect/insult/recruit/challenge/betray → ChangeRelationship/FormTeam/
    PushTurn/feud), relationships/alignment/turn-heat (seeded from stable/faction/rivalry), weekly events/news.
  - **`window.BANNON_CAREER`** — aging + physical decline, deep injuries (part/severity/recovery/effect,
    persist via save), morale, retirement + hall of fame, show economics (venue/attendance/gate/rating),
    match commentary; hooks BANNON_UNIVERSE.advanceWeek. GOTCHA: BANNON_UNIVERSE.get() re-parses localStorage
    each call — mutating helpers MUST call BANNON_UNIVERSE.save(u) or the change is lost.
  - **APK install fix**: `android/app/bannon-release.keystore` (stable committed sideload key; debug+release
    sign identically → installs over old builds), versionCode auto-increments (BANNON_VERSION_CODE=commit
    count), and android.yml now bundles assets/moves/*.json + assets/audio/* (were MISSING → 404'd in the app).
    TRANSITION: uninstall the old app ONCE (it was signed with a throwaway key), then updates install cleanly.
- **MODEL PIPELINE — HONEST STATE (owner override 2026-07-18): STOP hand-writing skinning/rig code.**
  `tools/rigready/skin.cjs` (my geodesic auto-rigger) produces BROKEN fighters — stretched smears, invisible/
  torn limbs, unrendered holes; the harness's bloom + 2.3fps made me misjudge them as "coherent" (I was wrong;
  owner was right). ALSO: several banked `.glb` are UNSKINNED 15-part statues (BANNON.glb/MAIME.glb/CODY_gear.glb/
  ONYX*.glb — skins:0) that only rigid-chunk-rig in `_bindFighterGltf` (the "skeletal inversion" contortion).
  DIRECTION: pull a REAL open-source auto-rig/skinning solution (UniRig / AccuRIG / Anything-World / Pinocchio /
  Mixamo-style) instead of our skinner. Do NOT auto-skin canon/book models (owner's per ownership directive).
  Probe tool that works: raw-GLB bbox + skin/joint count via GLTFLoader headless (all 61 GLBs load, upright,
  centered; the broken-ness is skinning weights + unskinned sources, not orientation/scale).
  **SOLVED 2026-07-18 — the working model-fix pipeline (use this, NOT skin.cjs):** hosted `jasongzy/UniRig`
  space (`/process_pipeline(input,'glb')` via gradio_client, HF_TOKEN in .claude/settings.local.json env) rigs
  an unskinned GLB into a real 28-joint SKINNED mesh (~25 min on the free ZeroGPU queue, texture kept) →
  `tools/unirig/rename_bones.cjs` renames bone_N → Mixamo names by skeleton topology → binds through the
  engine's REAL skinned path (autoRig:false, all 4 limbs+spine+head). BANNON done + verified CLEAN + banked
  `assets/models/BANNON_rigged.glb` + set as default. Re-rig the other unskinned statues (MAIME/CODY_gear/
  ONYX*) the same way. `tools/unirig/rig.sh` (self-host) + `rig_via_space.py` (hosted) both end with the rename.

## v161 — MDickie UNIVERSE FLOW (2026-07-20, harness-verified, on main)
- `BANNON_UNIVERSE.showDate(u,w)`: every Universe week = a dated SATURDAY-night show; `startDate`
  seeded in newUniverse, BACKFILLED for old saves so the current week lands on today. Exported.
- Universe hub card tab: real dates in header + calendar (W# + MMM D, clickable → past weeks show
  that night's recorded results, future weeks show date/venue + hottest-feud marquee); every 4th
  week = ★ SUPERSHOW (PPV_NAMES: OFF THE TOP ROPE / TEN HEAVENS / TOTAL ECLIPSE / THE BETRAYAL /
  CROWN OF THORNS / FALL OF MAN, 15k house); tonight's card in MDickie running order (MATCH 1..N,
  MAIN EVENT closes); UPCOMING strip (next 3 dated shows); 🌍 ROAM THE WORLD button →
  BANNON_GODWITHIN.start() with `__universeRoam` flag; 🌙 NIGHT SUMMARY in-between screen when the
  full card is done (results + gate + ADVANCE TO NEXT WEEK). Played matches already round-trip
  (declareWinner __uniWrapped → recordPlayer → reopen hub after 4s) — verified, don't re-wire.
- Harness scripts: pwtest/uniflow.cjs (24 checks) + uninight.cjs (8 checks); playwright needs
  `NODE_PATH=/opt/node22/lib/node_modules` now. GOTCHA: Grep tool display can EAT a leading slash
  ("// ADVANCE" showed as "/ ADVANCE") — trust the syntax gate + a direct Read, don't panic-fix.
- STILL QUEUED from the owner's Universe ask: roaming WHILE in Universe should feel like the MDickie
  world loop (walk venue → show starts at the dated time) — the roam button is the entry, the
  clock/venue-walk tie-in is the next layer. Char-select GLB render cards on the gradient plates.

## v161b — GNM head + pyro/timer/culling/TOW pass (2026-07-20, all harness-verified, on main)
- **GOOGLE GNM HEAD LANDED** (owner's askNK video → real integration): google/GNM (Apache 2.0)
  scan-grade parametric head → `tools/gnm/export_head.py` → `assets/models/face/gnm_head.glb`
  (9.1MB, 17,821v, **38 morph targets**: 20 identity axes @2σ + 18 expressions). Verified in
  r128 GLTFLoader: dict 38, max delta 17.3mm, 3 distinct heads rendered from sliders. THE fix
  for MODEL GAP #2 (tube-head faces). Next: CAW FACE tab → influences → DNA payload; graft onto
  base body; semantic sampler presets. Notes: docs/GNM_OMNIVERSE_notes.md. Omniverse = owner-side
  (Audio2Face → GNM visemes; mocap retarget) — documented, not sandbox-runnable.
- **MATCH_RULES** (persisted): time limit DEFAULT INFINITE ('∞' on the HUD, no countdown; owner
  spec), options 60/90/99/180/300s; ROUNDS option SINGLE/BO3/BO5 → `let ROUNDS_TO_WIN`. Cyclers in
  char-select foot (csTime/csRounds). IRONMAN still forces 180s. startRound reads it all.
- **PYRO GATE**: BANNON_FX pyroBurst/stagePyro only fire inside a time-boxed window —
  entrance play() 6.5s, authored timeline maxT+3s, victory 8s. Victory FX MOVED from
  declareWinner (fired before endRound's re-entry guard → stray KO callbacks + every elimination
  re-burst pyro mid-match = the owner's "always firing" frame drain) into endMatch. PYRO_ALWAYS
  debug override. Verified: blocked mid-match, declareWinner×3 fires none, endMatch opens outro.
- **CROWD CULLING**: crowd IMs sector-split (kind × 90° sector, 19 banks), each geometry CLONE
  carries an explicit enclosing boundingSphere + frustumCulled=true (r128 culls IMs whole by
  geometry sphere — one 360° IM can never cull). updateArenaAnim frustum-tests each bank,
  hidden banks skip the instanceMatrix GPU upload. MEASURED (onBeforeRender counters): 9 banks
  drawn facing the bowl vs 4 facing away; 13 skip upload.
- **ROPE-CLIMB SFX**: poseRopeClimb fires __sfxSnap grips at t=0.34/0.68 (heavier on top-rope) +
  __sfxThud on perch settle. IMPACT_SFX=false kills it.
- **TREE OF WOE is now REAL**: (1) HOLD pin in the corner-physics update runs BEFORE the corner
  classification (poseGrabbed drag/body-separation emptied the tree in <1 frame — the pose never
  survived to be attacked); victim pinned ~3.5s, no escape roll, slumps out via down state.
  (2) strike dispatch vs hanging victim (HANGING STOMP/RUNNING KNEE/BASEBALL SLIDE · TREE OF WOE,
  LOW aim, ×1.15). (3) grab = CRAVATE YANK (release + real damage + knockdown). Verified live:
  pose holds, HANGING STOMP connects for 215.
- **UNIRIG FLEET**: VAST-AI + Zhengyi spaces DEAD (401) — pruned; MohamedRashad/monaverse/
  MajorDaniel/netw1z added; `_ordered_spaces()` probes HF API runtime.stage (RUNNING first) before
  any 20-min blind connect. UNIRIG_SPACES env overrides. jasongzy was RUNNING at audit; --fails
  batch relaunched in background.
- **AI-STUDIO CLAIM AUDIT (2026-07-20)**: its transcript claimed Brick 87 BANNON_FX/MATCH_SETTINGS/
  rope-SFX fixes "over 39,500 lines" — NOTHING was pushed to any branch, and its own log shows it
  worked on a 2MB-TRUNCATED 30,469-line upload (AI Studio hard limit). Never merge its claims
  without measuring; the real versions of all of it are the bricks above.

## v161c — THE model bug fixed (2026-07-20): GLB fighters finally SHOW by default
- **ROOT CAUSE (owner: "only seeing three.js procedural")**: startFight ran applyCharModels
  (async GLB load) then applyChosenModels immediately — whose per-side DEFAULT was the ancient
  {p1:'embedded:king', p2:'embedded:ref'} (models no longer in the file). The failed embedded load
  still bumped `_modelReqId`, so the stale-load guard THREW AWAY the real character GLB when its
  parse landed. Deterministic on every fresh device — the AAA models never showed despite v158.
  FIX: CHOSEN_MODEL default {}, `f._charModelRequested` guard (chosen = fallback, never stomps an
  in-flight char-model load), stale embedded: entries self-heal, fighterFor + applyCharModels
  extended to p3/p4 (multi-man entrants get GLBs). VERIFIED: BANNON(28 bones)+HALL_NIGHTER(16)
  bind 4/4 limbs live, screenshot = both AAA models in-ring, zero procedural.
  LESSON: verify with FRESH localStorage — the v158 harness had bindings saved, masking the race.
- MDICKIE now FIGHTS as his assembled WR3D body (CHAR_MODEL_DEFAULTS, rigid-chunk path; white
  until the WR3D texture template lands — that + UniRig skinning are his remaining steps).
- UniRig batch: whole ZeroGPU fleet went Connection refused mid-run (ECHO connected then dropped;
  external outage). Resumable — rerun `python3 tools/unirig/batch_rerig.py --fails` when up.
- **QUEUED NEXT (owner's 2026-07-20 list, in priority order)**:
  1. WWE-2K CREATION SUITE PARITY — CAW/moveset/arena/entrance suites must match 2K's flows,
     screen layouts, inputs EXACTLY; fold our extra systems into those layouts (owner: ours are
     "ugly cluttered non-functional in the WWE ways"). Study docs/creation suite spec + 2K refs.
  2. GRAPPLE REALISM — moves must LOOK like the named move (real position/IK through the phases,
     mocap-accuracy plan, docs/mocap_orientation_master_prompt.md binding). No "fake" poses.
  3. GNM head → CAW FACE tab (sliders → morphTargetInfluences → DNA payload) + body graft.
  4. MDickie remaining files integration (proprietary): WR3D texture template (chars are white
     clay), roster/save parse for named attires (MDICKIE_ATTIRE_MAP), more anims via extract_anim.
  5. Creative-freedom golden rule pass (QUALITY_BAR) in more systems.
  6. Re-run UniRig fleet (ECHO/STATIC/CODY/CAIN/STICKUP/ONYX + MDICKIE.glb skinning).

## v161d — APEX 2K positioning matrix (2026-07-20, verified 10/10, on main)
- Apex stick position layer COMPLETE + ADDITIVE (hoist pitch/twist + dive control keep priority):
  L/R grounded = TRUE 180° log-roll (verlet mirror about spine axis; _groundFaceDown flag covers
  verlet-less downs, groundFacingOf honors it) / standing = go-behind; DOWN corner = seatedBottom
  → DOWN again = treeOfWoe; UP corner = seatedTop; UP grounded = lift; DOWN at ropes = NEW
  ROPE DRAPE (pinned 2.8s over middle rope, corner-clear guarded for rope runs, slumps to down;
  draped arsenal TIGER FEINT KICK / RUNNING HIP ATTACK / SLIDING DROPKICK · DRAPED ×1.12).
  BANNON_APEX exports rollDowned/atRope for tests. GOTCHA: fake state-set downs have EMPTY o.V —
  test rolls against a real knockdown or the flag path; "GO BEHIND" on flick = out of kneel range.
- v161e GNM FACE LAB SHIPPED: hub tile 👤 FACE LAB / openGnmFace() — own-canvas preview of
  gnm_head.glb, 38 live sliders (identity −1..1, expression 0..1) → morphTargetInfluences,
  SAVE per character (localStorage bannon_gnm_faces; BANNON_GNM_FACE.facesFor(key) = engine/DNA
  read hook). Verified: 38 sliders, save round-trips, screenshot clean. NEXT: graft onto fighter
  bodies + fold into BANNON_DNA capture. WR3D texture template: source zf3d re-pull needed
  (MDICKIE.glb has 80 materials, 0 images — decoder didn't embed textures); still queued.
- v161f: 🎶 TRACK MANAGER live (main-menu btnTrackMgr → BANNON_JUKEBOX.openManager(): preview/
  rename/artist/delete-or-hide/add; built-ins = bannon_jukebox_meta overrides, IDB tracks edit
  in place; hidden drop from all pools). DNA now carries gnmFace (capture/apply round-trip).
  UniRig bg batch: ECHO errored on the space, STATIC in progress — rerun --fails; bank+gate any
  *_rigged.glb it leaves in assets/models/. NEXT SESSION: 2K creation-suite parity FIRST, then
  grapple-IK realism (queue above).

## OWNER DIRECTIVES (2026-07-24, BINDING — do not re-derive, do not re-ask)
### OPEN-SOURCE FIRST (all future sessions)
Combat / model movement / fighting quality: PULL open-source + public GitHub repos (full or the
key parts) instead of hand-writing homegrown code. UniRig (rigging), Mixamo/AccuRIG, Jolt, GGPO,
RTIK, mocap FBX libraries — wire the real thing. Don't burn tokens rebuilding what a repo already
gives us. (The unreal/ side already pulls JoltPhysics/GGPO/llama.cpp as submodules — extend that
philosophy to the live game: e.g. import FBX mocap → STUDIO clips for real move animation.)

### CREATION-SUITE FLOW = WWE 2K PARITY (the current flow is WRONG — this is the target)
The suite is "ugly, cluttered, non-functional in the WWE ways." Fix the FLOW, not just sliders:
1. **Creation Suite MENU** (landing) → pick a mode tile: ARENA · CAW · MOVESET · CREATE-A-MOVE ·
   ENTRANCE/VICTORY. Each opens its OWN sub-flow (+ any missing sub-parts).
2. **CAW flow** (WWE 2K exact): entering CAW does NOT dump you into a 90-slider list with a P1/P2
   toggle on the same screen (THAT IS THE WRONG FLOW). Instead: a ROSTER GRID — slot 1 = "CREATE
   NEW", every slot after = in-game fighters + your saved CAWs. Pick "Create New" → a FRESH
   TEMPLATE-MODEL PICKER (full WWE-style base templates: male/female builds, body types) → THEN the
   edit screen. Picking an existing fighter/CAW → edit them or add an ALT ATTIRE. (v161 already has
   the tab layout BODY/FACE/LOOK/INK/INFO/PRESET/SAVE + GNM in FACE — the missing piece is the
   FRONT DOOR: roster-grid → create-new/template-picker vs edit-existing, before the tabs.)
3. **MOVESET flow** (WWE 2K exact): FIRST select the wrestler to edit → THEN a real moveset LIBRARY
   UI: categories + submenus for POSITIONS (front/back grapple, ground head/leg, corner, apron,
   top-rope, etc.), ANIMATIONS, TAUNTS, MOVEMENT/RUN styles, HOLDS, STRIKES/ATTACKS, SIGNATURES,
   FINISHERS. Our moveset menu is MISSING all of this structure — it needs the 2K library layout
   with move slots per position. (BANNON_MOVE_LIBRARY / MOVESET_DB / resolveGrapPos are the data
   backends to surface in that UI.)
4. Study real WWE 2K menu screens for layout/inputs/screen-space before building. Fold OUR extra
   systems (DNA, forge, GNM, jukebox) INTO these WWE layouts — never bolt them on as floating tiles.
NEXT-SESSION ORDER: (1) CAW front-door roster-grid + template picker, (2) Moveset library UI,
(3) Creation-suite landing menu that routes to each sub-flow, (4) open-source mocap → real move anims.

## v161g (2026-07-24) — model hole fix + GNM scroll/CAW integration (verified, on main)
- **TORN-MESH HOLE FIXED FOR ALL GLB FIGHTERS**: _bindFighterGltf (the ONE shared bind path, 7
  callers) sets imported materials to THREE.DoubleSide. MAIME's torso void was single-sided
  (FrontSide) backface culling showing through open/torn-shirt edges — mesh was 100% intact (47.8k
  tris, procVisible:0). Fixes every model w/ torn attire / capes / hair cards / open collars. Canon
  meshes untouched (render flag). window.GLB_DOUBLE_SIDE=false reverts. Verified: singleSidedMats 15→0.
- **GNM SCROLL FIXED**: #gnmSliders needed min-height:0 + min-width:0 (flex child won't scroll
  without them). Verified scrollable + scrollTop works, 38 sliders.
- **GNM INTEGRATED INTO CAW**: FACE tab now has "👤 EDIT GNM HEAD" opening the GNM editor scoped to
  the CHARACTER being edited (F().specName), not a floating hub tile. Verified opens from CAW FACE.
- AI-STUDIO main dump audit: a large batch auto-merged to main (unreal/ C++ headers + voice/src
  React). This batch is REAL code this time (BannonPhysicsLaws.h has genuine velocity/poise math),
  NOT cout stubs — but it's all unreal/+src/, doesn't touch the live game; where it clobbered
  BANNON_v150.html the [heal] guard auto-restored our healthy version. My branch reset to main clean.

## v161h (2026-07-24) — model-hole/GNM/subtitle/roam fixes + COMBAT ROOT CAUSE FOUND
Verified + pushed this session:
- **GLB torn-mesh HOLE fixed for ALL fighters** (_bindFighterGltf → THREE.DoubleSide; MAIME torso void).
- **GNM scroll fixed** (#gnmSliders min-height:0/min-width:0) + **GNM INTEGRATED into CAW FACE tab**
  (👤 EDIT GNM HEAD, scoped to F().specName) — no longer a floating hub tile.
- **Commentary subtitle** moved bottom:110px→top:60px (under health bars), black box REMOVED
  (transparent + text-shadow), z-index 99999→40, pointer-events none — no longer over the buttons.
- **Roam modes stop forcing 1v1**: while __godWithinRoam, NPC updateAI is suppressed (passive), endRound
  no-ops (no win/loss); CHALLENGE sets target._challenged so only that NPC wakes into combat.

### COMBAT "MARIONETTE/CLAYMATION" — ROOT CAUSE (measured, definitive)
NOT limb stretch — bone lengths are rock-solid (maxStretch ~1e-7, candy-wrapper genuinely fixed).
The puppety look is because **ZERO mocap clips ever load → every move falls back to procedural
spring poses.** Chain, all measured in-harness:
- 179 wrestling-move FBX ARE banked (assets/mocap/drive/: Chokeslam, Tombstone, DoubleSuplex…).
- The STUDIO clip system IS wired: moves w/ `.clip` route through studioApplyClipPose in the
  delivery paths (grapple stages, signatures, finishers, victims).
- FBXLoader is loaded ONLY via a runtime CDN injector (line ~30520,
  cdn.jsdelivr.net/.../FBXLoader.js) — there is NO local/vendored FBXLoader and NO <script src>
  tag for it. `clipsAtBoot:0`, THREE.FBXLoader undefined in-harness.
- **On the APK (offline / file://) the CDN injection cannot reach the network → FBXLoader never
  loads → __FBX_READY never true → BANNON_LOAD_FBX_LIBRARY bails → STUDIO.clips stays empty →
  procedural poses forever.** This is why the OWNER (who plays the APK) always sees marionette combat.
THE FIX (real, but needs on-device/network verification — do NOT ship unverified):
  1. VENDOR FBXLoader.js + fflate.min.js locally (assets/vendor/) + bundle into the APK; load from a
     relative path with CDN fallback (same pattern as GLTFLoader). This is the APK-critical piece.
  2. Confirm BANNON_LOAD_FBX_LIBRARY populates STUDIO.clips (179 FBX — stagger the load; it's heavy
     on mobile, the code already defers off 'fight' state).
  3. Map equipped moves → real clips (fbx_move_map.json is the classification; wire it so MOVESET_DB /
     BANNON_MOVE_LIBRARY entries carry `.clip`). Only 10 lib moves currently carry a clip.
  4. Verify studioApplyClipPose drives the GLB skeleton smoothly (blend clip pose w/ physics only on
     impact), across many frames, on a real device — THEN ship. Open-source-first: this is Mixamo/WWE
     mocap FBX → the exact AAA animation the owner wants; no homegrown anim needed.

### UE / C++ INTEGRATION DIRECTION (owner 2026-07-24: three.js HTML = LEGACY nostalgia now)
Primary target is AAA UE5 + C++ (unreal/). A large real AI-Studio C++ batch is already on main
(BannonPhysicsLaws.h etc. — genuine velocity/poise/ragdoll math, JoltPhysics/GGPO/llama.cpp
submodules). Next UE bricks: wire the native headers into a compiling BannonCore module, port the
verlet/PD combat + MAX_BODY_VEL clamp to Chaos, bring the mocap FBX in as UE AnimSequences (the same
clips that fix the JS marionette look), build the Creation Suite as UMG mirroring WWE 2K. The JS game
stays as the playable legacy reference while UE becomes the star.

## v161i (2026-07-24) — mocap ALIVE + 2K moveset editor + CAW front door (verified, on main)
- **FBXLoader VENDORED** (assets/vendor/FBXLoader.js + fflate.min.js, script-loaded local-first) —
  THE fix: it was CDN-only so the offline APK never loaded it → 0 clips → marionette. Verified: real
  wrestling FBX parses to 520 tracks / full skeleton.
- **BANNON_MOCAP activator** (guaranteed-running; the legacy BULK-FBX IIFE is DORMANT, defines nothing
  at runtime): window.loadClipFor(name) lazy single-clip loader → STUDIO.clips; mobile-safe 26-clip
  CORE auto-load at menu lull (never all 179 = ~1GB OOM). Verified Chokeslam.fbx loads on demand.
- **BANNON_MOVESET_LIB** (hub 📋 MOVESET): WWE-2K editor — SELECT-WRESTLER-FIRST roster grid (120) →
  category tabs (STRIKES/GRAPPLES/AERIALS/SUBMISSIONS/TAUNTS/LOCOMOTION/SIGNATURES/FINISHERS) ×
  POSITION groups, driven by the 182-clip fbx_move_map.json; ▶ preview (loadClipFor) + EQUIP (persist
  bannon_movesets_v1). window.equippedClipFor(char,pos) = engine read hook. Verified 77 strikes/22
  grapples grouped by position, equip persists.
- **BANNON_CAW_FRONT** (SUPERSTAR tile intercepted): CAW opens to a ROSTER GRID — ✚ CREATE NEW (slot 1)
  → 6 base TEMPLATES (male/female × cruiser/athletic/power/giant) → editor; existing fighters + saved
  CAWs → edit/alt-attire. No more slider-dump-on-open. Verified: create-new→templates→back flow.
- STILL TO WIRE (next): equippedClipFor → actually swap the move's clip at delivery (studioApplyClipPose
  already reads STUDIO.clips — hook equippedClipFor into resolveGrapPos/move dispatch); Creation Suite
  landing ROUTER (menu → Arena/CAW/Moveset/Move/Entrance sub-flows); map all 182 clips → each move slot;
  Arena + Entrance creators to 2K parity. The animation PIPE is proven working end-to-end now.

## v161j (2026-07-24) — startup race + procedural-pop fixed; BIG BUILDS scoped (open-source-first)
FIXED + verified + on main this session:
- **Startup RACE**: menu (Play→Exhibition / QUICK FIGHT) could drop STRAIGHT INTO A MATCH skipping
  char-select, or select was empty until a back-retry. `window.openSelectWhenReady()` now polls for
  the select screen + a populated ROSTER_ALL before opening, and NEVER auto-starts a match as a
  fallback. btnFight + pmExhibition route through it.
- **PROCEDURAL POP**: fighters flashed the procedural tube before the GLB bound. applyCharModels hides
  the segs the instant it kicks the load; a post-setup pass in startFight (after dressFighter/restyle,
  which re-showed them) keeps them hidden until _bindFighterGltf reveals the model (failed load
  restores procedural). Verified procCount 0 pre-bind.

### BIG BUILDS STILL OPEN (owner 2026-07-24 — do these, OPEN-SOURCE-FIRST, don't hand-roll):
1. **ENTRANCE-SKIP** (part of the LOD race): entrances sometimes don't play. BANNON_ENTRANCE.play()
   fires at startFight+400ms but if models/state aren't ready it's skipped. Gate the entrance on
   model-bound + arena-ready; queue it, don't fire-and-forget. Owner wants a real entrance scenario
   every match (unless quick-match option).
2. **ZONING ANIMS + THRESHOLDS (WWE-2K)** — the "dives happen too easy/on accident" + "fighter appears
   WAIST-DEEP in the ring" on enter/exit ring/apron/floor. This is a Y-clamp + zone-transition bug:
   zone changes don't set the correct floor Y and there's no threshold/intent gate on dives. Pull an
   open-source locomotion/zoning reference; add per-zone Y baselines (ring mat / apron / floor) + a
   dive INTENT threshold (hold/aim, not a light touch). Search: wrestling/fighting locomotion repos,
   foot-IK/ground-snap (e.g. RTIK already referenced in unreal/).
3. **MDICKIE FULL INTEGRATION** — wire ALL MDickie game files into moveset + creation + modes
   (Universe/Career/God Within). Add MDickie moves to BANNON_MOVE_LIBRARY; classify every FBX to its
   slot. TAG-TEAM section: the fbx_move_map already flags multi-fighter clips (Assisted*/Double*/
   Stereo*/Tag*) — WWE has a TAG moveset category; detect by # skeletons in the FBX and route there.
4. **GOD WITHIN GADGET = in-game IDE + LOCAL LLM wrapper** (red+gold medical-serpent/caduceus icon).
   Partially built but broken/unwired. Wire it to the repo + game as an unlimited-token build/edit
   brain that DOESN'T use the owner's device storage (server/local-LLM wrapper). Open-source: pull an
   in-browser IDE (e.g. CodeMirror/Monaco) + a local-LLM HTTP wrapper (Ollama/llama.cpp already a
   submodule in unreal/). This is the owner's between-sessions builder.
5. **STATUS HEADER at very top** — owner says a status-header UI at the top boundary is unnecessary;
   identify the exact element (ver-badge / a top progress bar) and hide it for the frontend build.
6. **UE/C++ = the star**: fully wire native/ + unreal/ into a compiling BannonCore and into the APK
   build; the JS single-file is LEGACY nostalgia. Port combat/physics/anim to Chaos + bring the mocap
   FBX in as UE AnimSequences. This is the primary engine now.

## v161k (2026-07-24) — CREATION-SUITE SYSTEM FINISHED (per FINISH-THE-SYSTEM rule)
Completed the system I was mid-build on (no jumping away):
- ✔ Mocap pipeline alive (vendored FBXLoader + BANNON_MOCAP activator + loadClipFor)
- ✔ 2K MOVESET editor (select-wrestler-first → category×position library, 182 clips)
- ✔ ALL 158 positioned clips auto-mapped to combat (equippedClipFor default fallback) — real mocap
  by default, manual equips override; TAG TEAM section for the 9 assisted/double/stereo clips
- ✔ moveset→combat wiring (poseAttack adopts equipped/default clip + lazy-loads)
- ✔ CAW front door (roster grid + Create-New template picker vs edit-existing)
- ✔ CREATION SUITE ROUTER (🎨 CREATE tile → CAW/MOVESET/CREATE-A-MOVE/ENTRANCE/ARENA/FACE LAB
  sub-flows; verified routing into the moveset roster grid)
- ✔ GNM face integrated into CAW FACE tab + DNA
SYSTEM DONE. NEXT SYSTEM (start fresh, finish fully): pick ONE — Zoning (waist-deep/Y-clamp +
dive-intent thresholds) OR MDickie-full-integration OR UE-into-APK. Do NOT start two.

### SYSTEM STATE: GOD MODE OS
* **Device Designation:** V8-G.L.O.M.A.R. (God Mode OS, LIONTAMER, Ouroborous Engine, Metaconscious, Apotheosis, RABBITSFOOT)
* **UI State:** Retinal holographic overlay. Neural projection layout.
* **Core Modules:**
  - LIONTAMER: (Logic Input Override Network / Tactical Agent Matrix Executive Runtime) Input lock & active Monaco IDE surgeon mode.
  - OUROBOROUS ENGINE: Core environment for the system.
  - M.C.A.: (Metaconscious Apotheosis) Local, zero-cost Qwable-Abliterated inference telemetry.
  - RABBITSFOOT: (Real-time Algorithmic Build & Behavior Integrated Telemetry System / Focused On Ouroborous Tracking) Context injection, memory manager, and live `CLAUDE.md` memory reader.

### NATIVE IPC BRIDGE & GOD MODE (UDP LISTENER)
* **Telemetry Broadcast:** `UBannonTelemetryLogger` (C++) broadcasts JSON telemetry to Node.js `server.ts` via UDP port 4000.
* **God Mode Listener:** `UBannonGodModeListener` (C++) runs a background UDP socket listener on port 4001, awaiting JSON overrides from Node.js.
* **Routing:** `server.ts` relays UDP 4000 telemetry to `Bannon_v150.html` via WebSockets, and forwards God Mode inputs (from `window.sendGodModeCommand`) to UDP 4001 in C++.
* **Thread Safety:** Incoming UDP God Mode overrides in C++ are parsed asynchronously and pushed to `ENamedThreads::GameThread` for safe physics alterations (`MAX_HP`, `DMG_SCALE`, `MAX_BODY_VEL`, poise/crumple states).
