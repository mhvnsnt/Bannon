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
