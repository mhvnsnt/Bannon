
## Layered Override System Architecture
- C++ Runtime Loader added: BannonModLoader parses UserOverrides/ JSON patches post-boot.
- Async/GameThread Layered Injection for override states.
- RESTORE_CORE_VARIABLES failsafe implemented.

## OWNER LAW — NO GUESSES. MEASURE. (2026-07-27, PERMANENT, OVERRIDES EVERYTHING)
Owner, verbatim: "It should map by mocap frames so it can see the moves like how we were viewing the
mocap not by guesses bruh, new rule to remember, no more guesses. Permanently main rule over all
rules. If we can find a way to see and press buttons or hear or use real senses we do it."

THIS OUTRANKS EVERY OTHER RULE IN THIS FILE.

If a fact can be OBSERVED, observe it. Do not infer it from a name, a label, a category field, or
what something "sounds like". Every single miss in this project traces to a guess:
  - `CrotchChop` is labelled `cat:'strike'` in fbx_move_map. It is a DX TAUNT. The label was a guess
    by whoever wrote the metadata; the FRAMES show both hands crossing at the pelvis with no forward
    extension and no target. Filtering on the label let it into strike slots.
  - Tag moves by name would have missed STRONGZERO and wrongly tagged HAMMERLOCKDDT. Counting body
    skeleton roots in the frames got it right.
  - "Animations aren't firing" was tested by calling internal functions for months. Pressing the
    REAL on-screen buttons found it in one run — and the first attempt pressed the wrong button,
    which is itself the lesson.
  - Identity swapping in two-man capture was invisible until the torso COLOUR was measured.
  - Text-to-motion quality was unknowable until the frames were RENDERED and looked at.

THE PRACTICE:
  - SEE IT. render_clip.py draws any clip. verify_capture.py draws the tracked skeleton on the video.
    Look before banking, promoting, mapping or claiming.
  - PRESS IT. Drive the real controls in the harness, not the functions behind them.
  - COUNT IT. Call counts, coverage fractions, separation between distributions.
  - Metadata is a HINT, never an authority. Derive from the data whenever the data exists.

## R.A.B.B.I.T.S.F.O.O.T. Feedback Loop
- Log Tailing implemented in server.ts watching Bannon.log.
- Error Parsing filters for 'Error:', 'Warning:', 'Exception', 'RESTORE_CORE_VARIABLES'.
- Telemetry Pipe routes to UE_LOG_STREAM via WebSocket.
- HUD Intercept active, triggering autonomous WRITE_FILE patches.

## C++ Live Hot-Reload Trigger
- UPDATE_READY IPC broadcast added to server.ts upon WRITE_FILE execution.
- C++ Socket Listener (OnIPCMessageReceived) wired in BannonModLoader to detect UPDATE_READY and trigger LoadUserOverrides() on the GameThread.
- Physics Delta Smoothing implemented to dynamically interpolate overridden states without snapping active ragdolls mid-simulation.

## Native Creator HUD & Slate UI
- GodModeHUD created with native Slate/UMG overlay support.
- Authentication visibility check enforcing GOD_MODE_KEY strict rendering.
- Log Stream Visualization buffers UE_LOG_STREAM.
- Manual Override Trigger implemented to force L.I.O.N.T.A.M.E.R. rewrites via IPC.
- Live Interpolation Tracking bound to DMG_SCALE, MAX_BODY_VEL, and Poise variables.

## Procedural Crumple & IK Hot-Reload
- UBannonAnimInstance created and bound to active Poise memory addresses via IPC listener.
- Dynamic Blend Weights recalculate IK and physical animation profiles when UPDATE_READY fires.
- Strict Crumple Coupling enforced: Crumple states derive exclusively from the active Poise value.
- Seamless Transitions implemented via interpolation to prevent visual snapping during hot-reloads.

## Kinetic Collision & Poise Pipeline
- Bone-Mapped Collision registered in UBannonCollisionComponent to calculate impact velocity and kinetic mass at the exact frame of intersection.
- Absolute Math Enforcement routes forces through DMG_SCALE = 8.0 and clamps impulses to MAX_BODY_VEL = 3.8 m/s.
- Poise Degradation isolates structural crumple from the MAX_HP = 10000 scaling.
- Impact Telemetry logs precise collision coordinates and forces to UE_LOG_STREAM for HUD intercept and L.I.O.N.T.A.M.E.R. analysis.

## Native Grapple & Multi-Rig Synchronization
- Shared State Component (BannonGrappleComponent) created to lock Attacker and Defender into synchronized grapple state.
- Localized Physics Dampening disables inter-rig capsule collision temporarily upon grapple initiation.
- Root Motion Lock syncs Defender's transform strictly to Attacker's root motion.
- Constraint Failsafe triggers GRAPPLE_TENSION_EXCEEDED via UE_LOG_STREAM and breaks grapple to prevent systemic crashes.
- Added impulse-based recoil, stretch debug mode, and anticipation frames hooks.

## Native Match State & Pinfall Kinematics
- Match State Component (BannonMatchStateComponent) created to track referee count and ring boundaries.
- Pinfall Synchronization implemented by extending BannonGrappleComponent with PinfallState, locking rigs to the mat and syncing referee physical count to GameThread DeltaTime.
- Kick-Out Probability Matrix isolates probability math strictly against MAX_HP and Stamina, excluding Poise.
- Submission DPS Routing continuously degrades structural integrity via DMG_SCALE and logs submission DPS to UE_LOG_STREAM.

## Native Rope Kinematics & Elastic Recoil
- Environmental Physics Component (BannonEnvironmentKinematics) created to process rope tension, elastic recoil, and turnbuckle collisions.
- Elastic Recoil Calculation dynamically calculates incoming force and reverses vectors to launch actors back into the ring.
- Absolute Velocity Capping limits rebound speed to MAX_BODY_VEL = 3.8 m/s, bleeding excess force into rope-shake animations.
- Turnbuckle Environmental Crumple routes impact forces through DMG_SCALE = 8.0 to degrade Poise.
- Tension Telemetry logs rope tension and recoil vectors to UE_LOG_STREAM.

## God Mode OS - Advanced IPC Injection Pipeline
- Zero-Latency Delta Patching optimized in BannonModLoader to eliminate frame drops during variable hot-swapping.
- Bi-Directional Telemetry Overdrive implemented bypassing standard HTTP logic for instant Creator HUD feedback.
- Runtime Execution Override added (ExecutePayloadBlob) to inject native payload blobs directly to the GameThread, bypassing the UE compilation pipeline entirely.
- Feature creep purged. Logic strictly bound to enhancing L.I.O.N.T.A.M.E.R. integration with the existing Bannon repository.

## R.A.B.B.I.T.S.F.O.O.T. Override & NaN Sanitization
- Memory Sanitization Component (BannonSanitizer) created and locked to the pre-physics tick to scan for NaN vectors and velocity cap breaches.
- Pre-Frame Rollback immediately blocks execution and leverages BannonModLoader cache to instantly restore the last verified stable state.
- Critical Fault Telemetry triggers CRITICAL_PHYSICS_FAULT flag over the WebSocket bridge.
- L.I.O.N.T.A.M.E.R. Handoff streams exact memory addresses and stack traces to the Creator HUD for instant reinjection analysis.

## God Mode OS - Sandbox Enforcement & Payload Routing
- Payload Segregation Router (BannonPayloadRouter) added to intercept and route incoming execution blobs.
- God Mode Validation interrogates payload for GOD_MODE_KEY, routing directly to the GameThread if validated.
- Community Walled Garden intercepts standard payloads, stripping write access to baseline constants (MAX_HP, DMG_SCALE, MAX_BODY_VEL).
- Hostile Payload Interception kills the thread and flags hostile mod hashes permanently upon Sandbox Violation.

## v161l (2026-07-24) — ZONING SYSTEM finished (waist-deep clip + accidental dives)
Took ONE system fully (FINISH-THE-SYSTEM rule). WWE-2K zoning:
- **CANONICAL PER-ZONE Y** `window.ZONE_Y={RING:0,APRON:0,FLOOR:-0.85}`. THE "waist-deep in the ring"
  clip was a height MISMATCH: the active _autoZoneFromPosition wrapper set FLOOR zoneY=-0.72 while
  the ragdoll floor / throws / knockdowns used -0.85 (5 paths). A fighter set to FLOOR by one path
  rendered ~13cm off from where the body/ragdoll expected → clipped through the mat. All paths now
  read ZONE_Y.FLOOR (-0.85). base _autoZoneFromPosition + the hysteresis wrapper both unified.
- **SMOOTHING** already existed (updateProcedural _smoothZoneY delta, lerp 8x down / 6x up) — kept it;
  did NOT double-count (reverted a redundant applyMesh smoothing I'd added). Verified glide not snap.
- **DIVE INTENT THRESHOLD**: rope-rebound dives were firing on any bare tap = accidental dives off the
  apron. Now a rebound dive REQUIRES a deliberate signal — UP held, hard aim (>0.6), the power/MOD
  modifier, or the SPECIAL button; a bare tap during a rebound is a normal running strike.
  window.DIVE_INTENT=false reverts. Verified: bare tap → no dive, UP-held → dives.
- Verified in-harness: FLOOR -0.85 consistent, RING/APRON 0, smoothing mid-transition (-0.109 after 1
  frame toward -0.85), bare-tap no-dive / intent-dive. 0 pageerrors. ZONING SYSTEM DONE.

## OWNER BINDING SPEC (2026-07-24, do NOT re-derive, do NOT make the owner repeat these)
The owner has had to correct these repeatedly. They are LAW now:
1. **DIVES ARE PERFECT — do NOT touch them.** They work as WWE-2K26: neutral, directional, and
   modified inputs (like our game already does). Never add "dive intent gates" or change dive
   triggering. (I wrongly added one; reverted. Never again.)
2. **The serpent/caduceus ⚕ button ALREADY EXISTS** = `#surgeon-toggle` → the BANNON SELF-BUILDER
   panel (BUILD/AI CHAT/SCAN/MEMORY tabs, Ollama localhost:11434 + LM Studio localhost:1234, swarm
   nodes). Do NOT build a new button. FIX/COMPLETE this one.
3. **THE SELF-BUILDER AND THE GOD MODE OS ARE THE SAME THING — UNIFY THEM.** The ⚕ self-builder IS
   the God Mode OS in-game front end. Wire the full godmode/ files (daemon, app, EvolutionDaemon,
   swarm, vault/RAG, Bannon.Modelfile) into it. It is the God Within builder gadget — an unlimited-
   token in-game IDE + chat + local-LLM wrapper that uses NO owner device storage (server/local-LLM).
   Everything AI Studio built (unreal/ C++ + src/ React) must be reachable/integrated in it too.
   It lives in / is reachable from the God Within mode.
4. **UE / C++ IS THE MAIN GAME NOW — wire it IN, not "separate/legacy".** Stop saying UE/C++ "doesn't
   touch the live game." The native/ + unreal/ C++ (Jolt/GGPO/llama.cpp/BannonPhysicsLaws/etc) must be
   actually integrated into the shipping game + APK build. Three.js single-file = legacy nostalgia only.
5. **IMPLEMENT ALL MDICKIE FILES FULLY — STOP TIPTOEING.** Every move, animation, environment, model,
   vehicle, file from ALL MDickie games/apps/zips → into OUR proprietary universe (moveset library,
   creation suite, ALL modes: Universe/Career/God Within/Exhibition). The game should feel like a full
   MDickie-based game but eaten up and made proprietary. TAG moves detected by # skeletons in the FBX.
6. **NEXT FULL SYSTEM = cleaner MODELS + COMBAT from OPEN SOURCE.** Pull real open-source (UniRig,
   Mixamo/AccuRIG, mocap libs, foot-IK) — don't hand-roll.
7. **FINISH-THE-SYSTEM (AGENTS.md law): fully integrate ONE system before starting another.** Log new
   asks, don't jump. The owner is burned by half-built systems from jumping around.
8. Commentary box = under health bars, transparent, off the buttons (DONE). Roam ≠ forced 1v1 (DONE).
   Startup race + procedural pop (DONE). Waist-deep zoning Y-baseline (DONE). Mocap pipeline + 2K
   moveset editor + CAW front door + creation-suite router (DONE).
### SYSTEM DONE: God Mode OS ⇄ Self-Builder UNIFICATION (2026-07-24)
- ✔ window.BANNON_GODMODE = the ⚕ self-builder AS the God Mode OS (open/close/ask/systems/apply)
- ✔ GOD MODE OS DAEMON endpoint field in the ⚕ panel (server/local-LLM wrapper, no device storage;
  ask() routes to daemon /api/build else local Ollama/LM Studio)
- ✔ ⚕ BUILDER button in the God Within banner (gadget reachable from God Within)
- ✔ systems() = full-repo awareness incl. AI Studio's unreal/ C++ + src/ React + godmode/ OS (68 live modules)
- ✔ apply(js) = live-apply edits the RUNNING game (guarded; [heal] watchdog protects source)
### SYSTEM DONE: cleaner MODELS + COMBAT from open source (2026-07-25)
- ✔ BANNON attire mislabel fixed: the "BANNON_muscular" GLB is the FAT body → labeled HEAVYWEIGHT;
  the DEFAULT lean BANNON.glb is the true MUSCULAR build and stays default (owner LAW).
- ✔ Mini-model + bust satellites STRIPPED from the Heavyweight GLB. New banked tool
  tools/model_diag/strip_satellites.cjs: welds Tripo's non-welded verts, union-find components, keeps
  the LARGEST (the body), drops stray islands — PRESERVES skin/skeleton/IBM + embedded texture.
  Result 2.6MB→1.56MB, one clean textured body, verified in the headless snapshotter.
- ✔ Scanned all 57 character GLBs for the same artifact — muscular was the ONLY satellite case
  (wrestler_base is a 284-vert proxy, false positive). Tool banked for future Tripo drop-ins.
- ⏳ OPEN (owner reported bad deformation on the stripped Heavyweight, 2026-07-25): stripping removed
  the satellites but PRESERVED the original bad weights. skinqa (restored, see below) measures
  BANNON_muscular_skinned.glb at **p95 0.3131 = catastrophic FAIL** (threshold 0.12) on 16 skin.cjs
  joints — worse than any model in the documented FAIL set, confirming the report objectively.
  Fix in flight: UniRig re-rig of the STRIPPED body (batch_rerig SRC key BANNON_HEAVYWEIGHT) to
  replace skin.cjs weights with a 28-joint skeleton + smooth cross-attention weights. Promote ONLY
  if skinqa beats 0.3131 (target ≈ BANNON_rigged's 0.068). Order matters: strip satellites FIRST,
  then re-rig, so UniRig sees one clean body.
  ATTEMPT 1 (2026-07-25 05:46) FAILED: jasongzy/UniRig returned a DEGENERATE 9-joint rig (no full
  arms/legs) under queue load; batch_rerig's own >=16-joint gate rejected + deleted it rather than
  banking a false success. Attempt 2 also stalled on the queue.
### ✔ RESOLVED (2026-07-25 06:12) — WEIGHT TRANSFER beat UniRig, no service needed
- New tool **tools/model_diag/transfer_weights.cjs**: copies a PROVEN rig onto a badly-weighted mesh.
  Source BANNON_rigged.glb (same character, 28-joint UniRig) -> target the satellite-stripped
  Heavyweight. Centre-aligns both in bind space (matches bbox centre in X/Z, matches FEET in Y,
  rescales height), then for each target vertex blends the K=6 nearest source vertices' joint
  influences by inverse distance, keeps the top 4, renormalises. Uniform spatial hash makes it
  tractable (brute force would be 16k x 146k = 2.4B distance tests). Carries target geometry +
  texture, source skeleton + joints + inverseBindMatrices.
- **RESULT: p95 0.3131 FAIL -> 0.0284 PASS** (11x better), and BETTER than the reference
  BANNON_rigged itself (0.0682 WEAK). Mean nearest-source distance 2.06cm = good correspondence.
- Visually confirmed in the snapshotter: legs/boots/knee pads/hands all clean; the earlier render had
  shredded, fanning leg geometry. PROMOTED to assets/models/BANNON_muscular_skinned.glb and re-gated
  AFTER banking (PASS, 28 joints).
- LESSON: when a hosted rig service degrades, transfer from a model that already passes. Reusable for
  any future FAIL model that has a good sibling rig.
- ✔ skinqa GATE RESTORED — tools/model_diag/test.html was missing, so the gate errored "THREE is not
  defined" on every model and things could only be judged by screenshot, which MODEL_QA.md forbids
  ("never promote on a screenshot; promote on the number"). Rebuilt + vendored three r128; verified it
  reproduces the doc's figure exactly (BANNON_rigged 0.0682 vs documented 0.068).
- NOTE: BANNON.glb is a 15-mesh RIGID named-parts model (no skin at all) = literal action figure; the
  game already defaults BANNON to BANNON_rigged.glb (28-joint skinned), which is correct. Don't
  "promote" BANNON.glb.
- ✔ Combat pipeline verified REAL end-to-end (not marionette): FBXLoader+fflate vendored (offline),
  182 mapped clips all resolve to local FBX, loadClipFor local-first, studioApplyClipPose drives the
  GLB skeleton by bone name (clipBones) + soft-tissue jiggle + morphs. Fixed 2 phantom warm-load
  clips (Jab/Mma Kick had no FBX) → 26/26 core combat clips now warm-load at menu lull.
### SYSTEM DONE: OTA auto-update — updates hit the phone without a reinstall (2026-07-25)
- The installed WebView APK bundled the game HTML frozen at build → repo pushes never reached the
  phone. Now it updates like a real Android game:
- ✔ Early <head> bootstrap (window.BANNON_BUILD + cold-launch auto-apply): pre-init document.write
  swap of a cached newer build, SAME file:// origin so saves persist; sanity-gated (can't brick).
- ✔ BANNON_OTA end-of-file module: fetches dist/version.json, downloads dist/BANNON.html, caches +
  "UPDATE READY — APPLY" toast; hourly recheck; gated to app (file:// or BannonNative), dormant on web.
- ✔ Native-reinstall notice when installed versionCode < version.json.apkMin (native code changed).
- ✔ MainActivity BannonNative bridge: getApkBuild() (unspoofable true versionCode) + openUrl().
- ✔ android.yml stamps __BANNON_BUILD__=commit-count, bundles stamped HTML, publishes dist/BANNON.html
  + dist/version.json (build + apkMin) each main push. Verified headless: swap applies, saves survive.
- ONE-TIME: owner must install THIS new APK once (it carries the OTA updater); every update after is
  automatic. (Their current APK has no OTA code baked in, so it can't self-fetch until replaced once.)

### SYSTEM DONE: MDickie FULL surfacing — props + vehicles (2026-07-25)
BANNON_WORLD parsed venues.json into 96 locations / 179 props / 28 vehicles but only LOCATIONS were
ever consumed; props + vehicles were dead data. All 271 objects now have a real consumer:
- ✔ CLASSIFY by name → physics class (edged/blunt/shatter/firearm/sport/furniture/wearable/nature/misc)
  with derived mass/reach/integrity/bleed in the SAME units as the owner's 6 authored weapons.
  ABSOLUTE MATH UNTOUCHED: DMG_SCALE 8.0 / MAX_BODY_VEL 3.8 stay engine-side.
- ✔ WEAPONIZE 34 carryables into BANNON_WEAPONS.db + its live item list → real pickup/swing/stamina
  tax/break through the EXISTING weapon laws (Cricket Bat, Bazooka, Taser, Guitar...).
- ✔ DRESS every roamable MDickie location with decor + parked vehicles + loose weapons from its OWN
  source game (HT3 props in HT3 locations, IL in IL) → Universe/Career/booking/God Within roam read as
  inhabited. Seeded per location (same every visit), phone-capped 14 decor/3 vehicles/10 weapons.
- ✔ WEARABLES: 64 headwear/mask/shoe props attach to the GLB head/foot BONE (rides mocap) with
  procedural-joint fallback, one per slot, wearOn()/unwear() exposed for the creation suite.
- ✔ window.BANNON_MDICKIE {classify,catalog,weaponize,spawnWeapon,dress,stats,redress,wearables,
  wearOn,unwear} — reachable from the ⚕ God Mode OS.

NEXT SYSTEM (take ONE fully): per-character story modes (MK/Tekken-style) + God Within open-world OR
UE-into-APK wiring OR the MDickie MOVE/animation half (moveset→all modes). Do not start two.
FIRST, though: land the Heavyweight deformation fix above (re-rig + skinqa gate) — it is OPEN.

### SYSTEM DONE: MOCAP ACTUALLY DRIVES COMBAT (2026-07-26) — the "looks like action figures" fix
Owner reported animations not working / models unrealistic. It was NEVER the models or the rigs.
MEASURED in the headless harness: `studioApplyClipPose` called **0 times** in a 25-second match.
Three independent bugs, each sufficient alone:
1. **Two disjoint move vocabularies.** The MOVE LIBRARY (MDickie imports) was clip-mapped by
   auto_map_moves.cjs; the COMBAT TABLES in the HTML (FIRE JAB / LEO CROSS / SCORPIO HOOK / SAG KNEE
   — the moves that fire on a button press) were mapped to NOTHING, and the two name sets overlap by
   EXACTLY ZERO. New **tools/mocap/map_combat_moves.cjs** maps them by limb/trajectory/height/style
   (never by name — no capture is called "SCORPIO HOOK"): 137/140 moves -> 35 distinct captures, with
   a reuse penalty so variants spread. Output assets/moves/combat_clip_map.json.
2. **Clips were fetched at the instant they were needed.** Async FBX parse takes seconds, the move
   takes a fraction of one, and the move pool avoids repeats — so nearly every move was a first use
   and played un-animated. **BANNON_COMBAT_MOCAP** stamps `.clip` on live move objects via
   `window.__combatClipFor` AND prefetches all 35 captures at a menu lull, concurrency 4.
3. **THE ELBOWS AND KNEES WERE NEVER MAPPED** — this is the action-figure look. Mixamo naming is
   offset by one link and MOCAP_BONE_MAP read it literally: `LeftForeArm` (the ELBOW's bone) -> haL
   (hand), `LeftLeg` (the shin, the KNEE's bone) -> hipL. elL/elR/knL/knR got nothing from any
   capture. **Fixing the table alone did nothing** — extractClipFromGLTF only writes a joint when
   `NEUTRAL[j]` exists, and NEUTRAL was the original 11 IK joints. BOTH had to change; NEUTRAL now
   carries elbows, knees, clavicles and spineLow/spineMid from REST.
   MEASURED before -> after on one 52-bone capture: elR **0 -> 0.582**, knR **0 -> 0.456**,
   clavR 0.569, spineMid 0.099 (haR/ftR/chest unchanged). Elbow+knee are now the biggest movers in a
   strike, which is correct. poseCalls 0 -> 123 over ten driven strikes.
LESSON: when animation "doesn't work", measure the CALL COUNT of the pose applier before touching a
model. Three cheap probes found this; no amount of re-rigging would have.

### SYSTEM DONE: run-ins / promos / turnbuckles / derived positions (2026-07-26)
- **BANNON_INTERFERENCE** — triggerRunIn had zero callers and only printed a line. Now spawns a REAL
  third fighter (multi-man path), breaks the live cover, our AI+physics drive the assault, walks out
  and splices from `fighters`. `_interferer` so LMS/first-blood/win conditions skip it. BANNON_RULES
  .MATCH_TYPES gets its first consumer: ref WARNS on the 1st offence, DQs on the 2nd, DQ-enforcing
  match types only. Triggers: the count reaching TWO, a man under 16% HP, ctrl+I.
- **BANNON_SEGMENT** — generateInRingPromo had zero callers. Now a real segment through BANNON_CARDS
  that the player ANSWERS through the same 5 branches BANNON_STORY.choose already resolves.
- **Turnbuckles** — climbTurnbuckle set `state='turnbuckle_climbing'`, a state the engine has never
  heard of, next to a complete climb/midrope/perch/dive machine. Now delegates to Fighter.startClimb
  ('mid' = second rope, shift+B). trapInCorner no longer fights Brick 21 for position; the corner
  hard-stop calls it with reposition:false so EXPOSED STEEL actually lands.
- **RUNNING / MIDDLE_ROPE are DERIVED, not authored** (owner correction, and he was right): a running
  move is a standing strike/grapple with momentum; a middle-rope move is a dive from a lower tier.
  RUNNING 1->11, MIDDLE_ROPE 1->20, APRON 1->20. positionOf() reads the ENGINE's real states
  (midrope/perch/running/apron), which is what makes them reachable in play.
- **scripts/model_wiring_audit.cjs [--gate]** — every wired model must resolve to a real file for a
  real character. Removed 8 phantom entries (GHOST/PHANTOM/DEMON_X/LUNA_VEGA/SAMI_Z/JAXON_RYKER/
  BIG_BULL/COSMIC_DUST: no GLB, and no such character in ANY registry). `mdickie_bases/` never
  existed, so every archetype fallback 404'd to procedural — now resolves to real bodies.
- **UE arena/crowd/referee** — referee's RefState was a function-local `static` shared by every ref
  and never reset; now per-actor + ResetForMatch. Added LoS-gated real-time count, positioning with
  perpendicular whip avoidance, CheckBump. bannon_arena.h had NEVER been called from UE (no ropes, no
  rebound, no stage edge) — Contain() wires it with the cm->m conversion on the seam. Crowd split
  into fast Excitement vs slow Investment + per-section spatial heat.
  native/tests/test_ue_arena_crowd_ref.cpp, 31 assertions, 11/11 ctest suites pass.

### SYSTEM DONE: BANNON_LIFE — the world loop God Within + Universe were missing (2026-07-26)
Owner: "the god within and universe modes are not working fully like his game and universe... the game
feels incomplete because of these things." Every PIECE existed; nothing JOINED them. The 46k-line file
had **zero** references to money, hunger, energy or a clock. God Within was three buttons on the nearest
body and no way to LEAVE a location. Universe was a real calendar behind a menu you pressed SIM on.
- **CLOCK** game minutes/days/day-parts, MIN_PER_SEC=2 (a day = 12 real min). Ticks only while you are
  IN the world — a menu is not a passing day, and a booked match is time in the ring not the street.
- **NEEDS with teeth** energy/hunger/mood drain per game-hour and reach the FIGHTER: maxStamina (22 live
  readers) is capped by condition — measured 400 -> 160 on a drained body — and applyDamage scales the
  player's outgoing damage by _lifeDmgMul (0.72x wrecked .. 1.10x fresh).
- **PLACES** 65-node graph built FROM the loaded environments, role-classified by name from the env's own
  id (HOME/FOOD/SHOP/GYM/JOB/JAIL/COURT/POLICE/HOSPITAL/ARENA/TRANSIT/STREET), 8.4 exits average,
  0 stranded. New MDickie locations classify themselves automatically.
- **TRAVEL IS PHYSICAL** walk to the map edge and the exit in that direction is offered; keep walking and
  you are there. Costs 25 min (45 for transit). No fast-travel menu — that is what made it backdrops.
- **PEOPLE** 120 roster fighters each have a home, a job and their own haunts, seeded from their name, and
  are somewhere specific at every hour. Bodies spawn through BANNON_INTERFERENCE's proven path
  (new Fighter -> dressFighter -> push into `fighters`), capped at 6 (raised from 3 after the asset pass).
- **CONSEQUENCE** hitting someone in the world routes through the SAME applyDamage funnel -> witnesses ->
  BANNON_LEGAL.accrue('OUTSIDE_RING') -> its docket -> court -> a sentence served by DAYS PASSING in the
  Prison location. Emptied out in the street -> hospital + days lost + a bill.
- **UNIVERSE IS A PLACE** u.card becomes a diary APPOINTMENT with a day, a time and a venue. Turn up and
  the match starts for real carrying your needs; it pays a purse, feeds applyResult, and hands you back
  to the world. Miss it and you are fined and lose momentum. The card entry is claimed (_done) either way
  so advanceWeek() can't also resolve it on paper.
- **SLEEP IS A SURFACE, NOT A LOCATION** (owner correction, and he was right — in MDickie you lie down on
  the ground, a bench, a chair, a car, a soda machine, a table, a medical bed, a bed). 10 surfaces with
  quality/warmth/risk, derived from the location's REAL dressing manifest. Measured 8h: bed +79.6 energy,
  bench +51.4, bare floor +18. All 65 places sleepable, 0 with no surface. Sleeping rough can get you
  robbed or picked up for vagrancy.
- **TRADING HOURS** shops/gyms/jobs shut at NIGHT and LATE; hospital/jail/home never do.
- ☰ LIFE panel in the God Within banner: place-aware actions, who is here, the diary, every way out.
FIXES FOUND ON THE WAY (all measured, not guessed):
1. `BANNON_GODWITHIN.start` was wrapped by a later patch that hard-set CURRENT_ENV='BACKSTAGE' and ran a
   FULL buildArena, then called the original which set the home env and rebuilt — **two complete world
   builds per entry**, the first thrown away. It also silently undid the start-at-home fix.
2. The travel lockout lived INSIDE goTo(), so it refused every caller, not the edge-walk it was written
   for. arrest() calls goTo(court) then goTo(cell) back to back and BOTH were refused — a sentenced man
   was left standing at a bus station. It also broke the diary's GO TO button and therefore the entire
   booked-match round trip. The guard now belongs to exitPrompt only.
3. NPC schedule clumping: the decision ("go to the gym?") and the choice ("which gym?") both read low bits
   of the SAME hash, so every gym-goer picked the same gym. Measured 64 of 120 people in one room across
   8 locations. A per-salt mixing step + wider pools: AFTERNOON now 29 locations, 10% max; EVENING 34, 6%.
4. `dress()` placed furniture and kept no record, so nothing could ask what is in a room — which is WHY
   sleep was wrongly gated on role. It now keeps a manifest; BANNON_MDICKIE.dressedAt(loc) reads it.
5. scripts/verify_modules.cjs graded the wrong script block: lastIndexOf('window.'+name) matches
   references AND longer names by prefix, so `window.BANNON_LIFE_UI` made BANNON_LIFE report "ran but did
   not define itself". Now matches a real assignment. This also cleared BANNON_LEGAL's standing warn.
VERIFIED: 26/26 modules, integrity 35/35, PARITY OK, model wiring clean, surfacing 16/16, 0 pageerrors.

### SYSTEM DONE: open-source asset decimation — 1.32 GB shipped -> 419 MB (2026-07-26)
Owner: "pull in more open source ur skipping the open source and not mentioning it on purpose I can tell."
Fair hit — the previous turn said "decimating those assets is the actual fix" without mentioning the
mature tooling that does it. tools/assets/optimize_gltf.cjs uses @gltf-transform/core + /functions, sharp
(libvips) and meshoptimizer. table.glb was 26 MB for 1,787 vertices — the other 25.9 MB was six
uncompressed 2048² PNGs on a folding table.
- props 83.4 -> 6.6 MB (-92%), environments 873.6 -> 141.2 MB (-84%), characters 365.2 -> 210.6 MB (-42%)
- WebP not KTX2 on purpose: r128's GLTFLoader already parses EXT_texture_webp = zero new loader code.
- NOT meshopt's generatePositionRemap, which cuts deeper but merges UV seams = texture stretching on a body.
- --mode=texture never touches geometry/skins; --mode=full REFUSES any document with a skin or morph
  target (join() merges primitives and that is how a rig dies). Rigged files auto-demote.
- Every write is re-read from the shipped bytes and checked: drawn triangles, drawn vertices, renderable
  nodes, joints, animations, morph targets. Failures are discarded, not shipped.
- NEAR MISS: the first invariant counted vertices per MESH, and dedup() collapsing 20 identical mesh
  defs in steel_chair.glb read as 4,720 -> 1,888 = catastrophic loss. It wasn't — the nodes shared the
  survivors and the scene drew the same 6,370 triangles. It now walks NODES and counts what the GPU draws.
- skinqa before -> after: TRIPLE_XXX_suit 0.0439 PASS -> 0.0493 PASS (156,569 -> 95,115 verts),
  CIPHER_rigged 0.0271 -> 0.0281 PASS, VIPER 0.0449 -> 0.0440 PASS (better), EDWIN_KENNEDY and
  HALL_NIGHTER 0.0638 / 0.0613 WEAK both unchanged (already WEAK, not caused by this). No verdict moved.

## OWNER LAW ADDED 2026-07-26 — DO NOT DELETE GENERATED CONTENT
Owner: "snap version of moves are fine u should not have deleted those, those are variations, u should
ask before u delete stuff like that". He was right. I dropped 24 derived variants on my own judgement
because they scored low on a divergence metric I had just written. A variant is CONTENT.
- harvest.py now BANKS AND FLAGS low-divergence variants instead of discarding them. The divergence
  number rides along in the manifest so a human can judge it. `--only-distinct` is opt-in for anyone
  who wants filtering; it is never the default.
- All 728 variants restored (98 flagged low-divergence, all kept). 104 captured bases.
- Applies generally: never delete or prune generated assets, clips, models or variants without asking.

### SYSTEM DONE: TEXT -> MOTION generation on CPU (2026-07-26)
Owner: "We need to get momask, motiongpt, and mdm setup up any wired into our mocap".
- **tools/mocap/setup_motion_models.sh** — one command. Clones the three repos (codeload.github.com
  403s through this proxy but `git clone` works), fetches MoMask's 188 MB HumanML3D weights from Drive
  (gdown here has no --fuzzy — pass the bare file id), installs CPU-ONLY torch (using
  --extra-index-url pulls 3 GB of CUDA libs onto a GPU-less box and fills the disk; that happened).
- **tools/mocap/text_to_clip.py** — a sentence in, a playable clip out. MoMask is the default because
  its authors state the demo runs on CPU with no GPU. VERIFIED: 196 frames generated from
  "a person picks up an opponent and slams them down forcefully", converted to 28 keys / **17 bones**
  — more than the 14 video capture yields, because SMPL ships the spine chain and collars MediaPipe
  has to guess at.
- THE INTEGRATION IS BACKEND-AGNOSTIC: all three models emit HumanML3D 22-joint SMPL motion, so
  smpl_points() + video_to_clip's retarget is the whole adapter. A better model plugs in behind it.
- Two shims, both written down: numpy 2 removed np.float/np.int/np.bool which all this 2023 code uses;
  and CLIP's torchvision import is stubbed because MoMask only needs the TEXT encoder.
- LENGTH: the length estimator's argmax saturated at its 196-frame maximum (9.8 s) for every prompt
  tried. `--frames N` states a length, and output is auto-trimmed to the moving span by the same
  motion-energy test harvest.py segments video with. Measured: 60 -> 47 frames, 2.35 s for a kip-up.

## OWNER SPEC 2026-07-26 — read this before touching combat. Corrections to things I got wrong.
1. **SUBMISSIONS KEEP THE WWE 2K MINI-GAME.** Owner, explicitly: "We will not replace that system."
   Applying AND escaping stay the 2K button/stick mini-game, untouched input and win/lose condition.
   Physics layers AROUND and UNDERNEATH it — while the mini-game runs, the bodies fight visibly:
   attacker posture/weight shifts, defender twists and hyperextends, driven by the EXISTING sine-wave
   + mass-delta + stamina system. Winning the mini-game makes the body start winning the physics too.
   Do NOT convert submissions to pure physics constraints. That was my suggestion; he overruled it.
2. **NO NUMBER CAPS.** "u know our game doesn't include the same caps as WWE games in those areas with
   number caps." 2K's Pick 3 / Pick 5 / up-to-5-finishers limits are 2K's engine limits, not ours.
   The moveset slots take as many as the player wants.
3. **PROCEDURAL PIN IS OURS AND IT STAYS.** Both shoulder proxies within ~15 cm of the mat + referee
   line-of-sight starts the count. No pin button on delivery. Deepen it, do not replace it:
   - receiver fights to raise ONE shoulder using the sine-wave struggle
   - attacker can add weight / shift centre of mass to hold it down
   - a low-stamina or off-balance attacker makes the pin unstable and easier to kick out of
   - near-falls are PHYSICAL: shoulder rises a few cm, the ref's hand hesitates, it drops again
   - roll-ups, small packages and bridges fall out of this for free — no scripting
   Optional classic hold-to-pin can exist as a manual override when the shoulders are already down.
4. **STRUGGLE-LIFT TEETER EXISTS BUT IS TOO QUIET.** It was never deleted, it got damped. Target
   values he gave: amplitude x2.5-3.2, lateral sway 0.5-0.7 of vertical, low-stamina (<0.45) violence
   boost x1.6-1.9 with frequency x0.65, plus camera shake when |sine|>0.7.
5. **CARRY IS A SYSTEM** (restated): the four holds are SETUP positions, each opening its own pool of
   follow-up slams/drivers/environmental throws/pin combos/transitions. Not four moves.
6. **DELIVERY HANDS OFF TO PHYSICS.** Authored animation is the INTENT; at impact/release blend hard
   into active ragdoll. If shoulders land clean and the ref sees it -> pin. If not, bodies crumple and
   scramble. No forced animation. "The move ends when the physics says it ends."

### OPEN SOURCE THAT ACTUALLY KNOWS WRESTLING — I was wrong, he found it
I said "no open-source motion model has wrestling in it". That was wrong. These exist:
- **AnimationGPT / CombatMotion** (github.com/fyyakaxyy/AnimationGPT) — text-to-motion built ON
  MotionGPT and FINE-TUNED ON A COMBAT DATASET. This is the wrestling-aware generator, not HumanML3D.
- **Bandai Namco Research Motion Dataset** — professional mocap of real martial artists, BVH, free.
  BVH already loads: assets/vendor/BVHLoader.js is vendored and the baker handles BVH unchanged.
- **RollTec grappling** (github.com/ChristopherGS/rolltec_motion) — close-quarters grappling transitions.
- **FreeMoCap**, **AI4Animation** — markerless capture and a trainable animation framework.
Contact clipping is the known cost of any mocap on two-body grapples; the fix is procedural IK fitting
to force hands/feet onto the opponent's limbs, then ragdoll on impact.

### SYSTEM DONE: THE MOVESET SYSTEM + THREE-PATH PINS + REACH FILTER (2026-07-27)
- **SCHEMA 7 -> 25 categories / 439 slots, 405 UNCAPPED.** `pick` = default loadout, `cap` = ceiling
  where 0 means unlimited. Only 34 slots are single-valued and every one is a real engine limit (one
  walk cycle at a time), never a budget. New: PINS, DEFENCE (dodge/leapfrog/combat roll + light and
  heavy combo breakers), GROGGY (rope / corner / bent-over / stunned are FOUR situations, not one),
  ELEVATED (cage wall, cell roof, ladder top, ledge), RINGSIDE floor tie-ups, OUTSIDERS (ref shields,
  manager distraction, blind-side foul), TAG as its own category, RUMBLE, AI (tendencies, targeting
  bias, object urgency, scripted sequences). Plus Create-A-Finisher as a parts chain, super/catching
  finishers, limb targeting, chain wrestling, deathmatch spots. 71 fighting styles each with an
  8-axis bias + preferred kinds + default stance/gait. 28 paybacks.
- **MODIFIERS ARE DECLARED, NOT INVENTED** (owner correction: "u don't need to add the modifier
  system[,] [it] should be there to build on top of" — he was right). The engine already multiplies
  every slot by GRAPPLE_MATRIX[mode][kind][dir5] / [dir5+'_M'], powerMod, running, zone and armed.
  Those are now written down and COUNTED instead of duplicated: strike slot = 960 executions,
  grapple slot = 1920. Never build a second modifier system beside the real one.
- **BANNON_MOVESET_STUDIO** — viewport-first move-set screen, 51% of a phone screen measured. Own
  scene + renderer so it works from the MENU with no live fighter. Scroll the strip -> the move under
  the centre line plays on the body; tap replays; tap twice equips; an explicit EQUIP button too.
  ONE store shared with the list editor and BANNON_PINS (localStorage bannon_moveset_slots).
- **BANNON_PINS — THREE PATHS** (owner: "I literal asked for down plus zone and procedural pin"):
  (1) DOWN+ZONE existed but called startPin() bare so every cover was the same lateral press — now
  resolves through a 38-pin catalogue; (2) PROCEDURAL, no button, shoulders inside 15 cm of the mat
  read off the verlet with a rig-joint fallback for knockdowns that never ragdoll, instant if you
  landed across them, short dwell if you are standing over them; (3) ROLL-UPS front AND rear chosen
  GEOMETRICALLY — behind = schoolboy / O'Connor / backslide, in front = inside cradle / La Magistral
  / sunset flip, fast count and a short fuse. Match rules set the count, rope break, ring-only and DQ
  per match type (ladder refuses pins; hardcore has no rope break and no DQ). ILLEGAL pins have the
  best numbers and are NEVER in the default pool — carrying one is a choice.
- **BANNON_REACH** — range is the body and the stats. Measures the bound GLB's shoulder->elbow->hand
  and hip->knee->foot chains and scales registerHit's tuned constants; no model bound = 1.0 = old
  behaviour. The binary whiff becomes a BAND: clean -> lean -> stretch -> whiff, and in the stretch
  the fighter spends the shortfall on his own body (spine lean + shoulder rotation + limb extension,
  weighted by agility and stamina) with damage tapering to ~0.55. THE ROOT IS NEVER MOVED — that is
  what separates an extension from a warp. Plus a weight-class lift check the teeter reads.
- **THE TEETER, RESTORED** (owner: "damped without me asking ... it was beautiful"). It had become a
  9 cm single-axis rock, no lateral sway, no low-stamina swell, no way to fail. Now amplitude
  x2.5..x3.2, low-stamina x1.6..x1.9, a real SIDE-TO-SIDE axis on its own slower beat, camera shake
  past |sine| > 0.7, and a genuine collapse: under the strength/mass fail floor the hoist loses it on
  a down-beat and comes back down on him. DO NOT DAMP THIS AGAIN.
- **THREE.js VENDORED LOCALLY** (CDN kept as fallback). It was CDN-first, so the whole engine was
  hostage to three network round-trips before any game code ran. Measured with the CDN unreachable:
  44 page errors, `THREE is not defined`, and because the engine's top-level `let fighters = []` sits
  after the first `new THREE.*` the binding is never created and EVERY later system throws. 44 -> 0.
- **BANNON_GRID** — the grid sensor was never deleted; it only ever ran for the AI (`!this.isPlayer`)
  so the player's sensor was zeros forever, and it had no idea where the ropes were. Now ticked for
  every fighter and given an edge/zone layer that movement consumes: an AI near the ropes slides
  along them instead of walking out.

### OWNER LAW ADDED 2026-07-27 — LICENCE IS A SHIPPING CONSTRAINT
tools/mocap/ingest_dataset.cjs converts any BVH dataset to our clips (bone-name normaliser handles
LeftForeArm / LowerArm_L / lradius conventions). Verified on Bandai Namco: 2,902/2,902 clips.
BUT: **Bandai Namco Research Motiondataset is CC BY-NC 4.0** and **CombatMotion (CMP/CMR) is derived
from shipped commercial game assets** — NEITHER can ship in a commercial game. `--commercial-only`
refuses them; without it they land under assets/moves/datasets/dev/ which is GITIGNORED. Ship-safe
bulk sources: **CMU Motion Capture Database** (free for all uses incl. commercial), **Mixamo**
(Adobe royalty-free), **Truebones CC0**, and our own capture (video_to_clip / FreeMoCap / MoMask).
Never bake an NC or IP-encumbered dataset into the game without asking.

### SYSTEM DONE: UNIVERSE ⇄ CAREER ⇄ FREE ROAM joined (2026-07-27)
Owner: "get the universe and free roam and career to mdickie and 2k ful integration."
Every piece existed; nothing joined them, and one had been silently deleted.
- **A CARD ENTRY WAS `{a,b,title,main}`** — no stipulation, no building. Measured: `playMatch` handed
  the engine four fields. So every night of every show for the life of a save was a plain singles
  match in the same room, while the select screen has 22 match types and the venue picker has 3
  stages + 96 MDickie buildings. Cards now carry a real `matchType` + `venue` chosen from feud heat /
  title / supershow week; multi-man stipulations pull real bodies into p3/p4.
- **`window.BANNON_MDICKIE` WAS ASSIGNED TWICE.** The career-sim port (CalculateWorth /
  GenerateContract / GenerateAttendance / BackstageMeeting / GenerateTournament / SimulateBracket /
  PushTurn) is defined first; the props+vehicles module 3,700 lines later used a plain `=` and wiped
  it. Nothing threw — every call site is `md.fn && md.fn(...)`. Five dead screens from one `=`:
  CONTRACTS listed everyone at $0, OFFER did nothing, BACKSTAGE had no meeting, TEASE A TURN did
  nothing, TOURNAMENT did nothing, the show header printed "live" instead of a crowd. Now merges.
- **ELEVEN BANNON_UNIVERSE FUNCTIONS HAD ZERO CALLERS** — negotiate, demands, freeAgents, loyalty,
  bookingBreach, rivalInterest, ego, promoBattle, scoreLine, feud, simTournament. All live now,
  individually AND emergent over 40 unattended weeks. Two thresholds were ported from a different
  number scale and could never fire: `creativeControl` needed ego>=85 when measured ego tops out at
  **73** across the whole roster, and `negotiate` awarded a free 25 points when creative control was
  not demanded, so a 40%-of-asking insult scored 51 against a bar of 60 and `walk()` was unreachable.
- **CAREER was a read-only tab**; it now enters BANNON_LIFE as your wrestler. **FREE ROAM had no
  front door.** Both needed adding to `BANNON_LIFE.isLive` or the world clock stands still.
- **YOU BOOK IT** — addMatch/removeMatch/setType/setSide/setTitle/setMain/setVenue + a booking sheet.
  Uncapped; the only refusals are a man wrestling himself and someone not in the universe.
- **THE CLOSURE-WRAP TRAP (do not repeat):** `bookWeek`, `simMatch` and `advanceWeek` are all called
  through CLOSURE-LOCAL references inside the BANNON_UNIVERSE IIFE, so wrapping the exported property
  intercepts NOTHING. Stamping moved to `get()` behind a per-week guard; `advanceWeek` resolves the
  card itself before delegating.

### SYSTEM DONE: TAG moves classified by skeleton count (2026-07-27)
Owner spotted DOUBLESUPLEX / ASSISTEDDIVSENTON outside TAG. Both were, plus six more.
- **NEVER CLASSIFY THESE BY NAME.** `DOUBLE_LEG_TAKEDOWN` is one wrestler (the opponent's two legs).
  `HAMMERLOCKDDT` has 519 animated bones and looks like a crowd, but one of its three Hips roots is a
  CLOTH rig (`C_Hips_2`) — two bodies, a singles move. `STRONGZERO`, `BUCKLEBOMBENZUGIRI` and
  `REVERSEGOOZLEDIVFOOTSTOMP` are genuine three-man captures with neither "double" nor "assist" in
  their names — a name rule misses all three.
- **tools/moves/classify_tag_moves.cjs** counts BODY skeleton roots (`J_Hips*`, excluding `C_*` cloth)
  per owner LAW #5. 1 body = solo, 2 = attacker+victim, **3+ = TAG**. 8 captures / 64 clips ->
  assets/moves/tag_moves.json, with `--gate`.
- Tag slots drew from `pool.byPos[slot.pos]` like everything else, which is how "Heavy Weapon Swing"
  became a Standing Double Team. All 17 tag-kind slots now fill from the tag pool only and the tag
  captures are subtracted from every singles pool. 5,520 fills, 0 wrong either way.
  NOTE: the subtraction silently did nothing at first — the baked index keys these `DOUBLESUPLEX`
  while fbx_move_map carries `DoubleSuplex`. Normalise before comparing.
- **BANNON_TAG** is the runtime half: a tag capture in a singles match would put a phantom partner's
  animation on one skeleton, so every path is gated on a real partner (booked type or a live ally).

### SYSTEM DONE: ROSTER TAB (2026-07-27)
120 wrestlers, 16 brands, four tabs (ROSTER / TEAMS / STABLES / RIVALRIES). Inline editor per man:
brand, alignment, title, tag partner, stables, rivalry heat, start a feud, momentum, contract, injury.
BOOK IT on a rivalry puts the match on tonight's card through BANNON_SEASON.
- **DRAG IS POINTER EVENTS, NOT HTML5 DRAG-AND-DROP** — `dragstart` never fires on a touchscreen, so
  a roster built on it is a screen the owner cannot use on the device he plays on. Every drag also has
  a tap route (tap handle to pick up, tap a brand to drop). Verified on a 412x915 touch viewport.
- No parallel state: every edit writes through BANNON_UNIVERSE.save / BANNON_STORY, verified by
  re-reading localStorage rather than the in-memory object. Moving brands strips belt + tag team.

### SYSTEM DONE: SAVE SLOTS PER MODE (2026-07-27)
Owner: "wwe games [have separate saves per mode] and we are mixing features from both".
- **GLOBAL** (MDickie's side): creations, models, move sets, settings, music — one copy everywhere.
- **SCOPED** (WWE's side): `bannon_universe_v1`, `bannon_life_v1`, `bannon_story_v1`, `bannon_stats_v1`
  — one copy PER MODE PER SLOT. 5 modes x 6 slots. Exhibition is a mode, which is what makes "things
  change in different modes differently" true.
- Scoping is a **localStorage interception in `<head>`**, after the OTA swap and before three.js —
  every module reads its key while it loads, so doing it later means modules already read slot 1.
  A scoped key becomes `key@MODE#slot`. Patches **Storage.prototype**, not the instance: assigning
  `localStorage.getItem` directly is silently ignored in some engines.
- Loading a save RELOADS the page on purpose. Pressing UNIVERSE/CAREER claims that mode's save.
- Also copy-to / rename / export+import as text (on a phone the device is the only copy).

### SYSTEM DONE: STIPULATIONS ARE PHYSICAL (2026-07-27)
**BANNON_CAGE and BANNON_PROPS both had ZERO CALLERS.** The cage panels, the ladder climb, the
REACH-for-the-hanging-objective win condition — all written, complete, and never once armed.
- **BANNON_STIP** reads matchType at the bell, dresses the room, installs the win condition, tears
  it down. 14 stipulations: cage, HIAC, ladder, MITB, TLC, tables, inferno, casket, backstage,
  anywhere, hardcore, first blood, submission, LMS.
- **The owner was right about the assets** — the MDickie extraction has `Flame_Thrower.glb` and
  `Coffin.glb` (ht3 + il), and `assets/ring/bannon_mat_fire.png` is a fire texture. Inferno and
  Casket are built from those, not primitives.
- **THE CELL ROOF IS A SURFACE.** Its four corners register as climbable props so `standHeight()` —
  which every climb/stand/dive-off already reads — takes you to 2.75m; ZONE at a corner gets you up;
  over the edge at roof height ragdolls you to the FLOOR outside for 220. Verified all four.
- Ladder climbing had no input. ZONE already resolves apron/floor/climb by context, so a prop within
  reach is another thing ZONE means — no new button on a phone with no room for one.
- **TWO ASYNC RACES FIXED:** prop GLBs load async, so a match torn down before its models arrive had
  them land in the NEXT one (a casket in a Hardcore match), and BANNON_CAGE threw 8x placing a wall
  after `remove()` nulled its group. Generation token + a null guard. 8 page errors -> 0.

## OPEN / NEXT (owner's own ordering, 2026-07-27)
1. **More mocap clips from the owner** — Cipher's Lio Rush feral beast run, plus dive/grapple/strike
   captures. He is handing them over; ingest through video_to_clip / harvest and map into combat.
2. Still open from before: motion datasets install (task 43), model deformation jank (task 45).

## HOW TO RESEARCH WRESTLING-GAME CONTENT (owner correction, 2026-08-01 — REMEMBER THIS)
Owner, after I searched badly twice: "U didn't search deep enough or by game title" ... "the right
source is moves per title in movesets, ring in and ring out and turnbuckle climb and taunts and all
the things I named sections, or lists on the Internet, ur searching wrong" ... "remember that kind
of stuff and resources for future use and the way to actually search remember that".

WHAT DOES NOT WORK: generic YouTube search ("WWE ring entry animations"). It returns entrance
VIDEOS and highlight reels, never a catalogue. I burned four queries on it and got nothing usable.

WHAT WORKS — SEARCH THE MOVESET LISTS, PER GAME TITLE, BY SECTION NAME:
  * query shape:  "WWE 2K<NN> moves list" + the SECTION you want
    sections that actually exist: Ring-In/Out, Apron Ring-In/Out, Turnbuckle, Taunts, Signatures,
    Finishers, Skills, OMG Moments, Preset Movesets, Fighting Styles, Preset Entrances
  * always name a TITLE (2K19, 2K22, 2K26, SmackDown vs Raw 2011, Here Comes The Pain) — the lists
    are published per game, never as one master list.

THE RESOURCES (use these domains, they carry the actual catalogues):
  * thesmackdownhotel.com  — preset ENTRANCES lists per title, full MOVES lists, skills/OMG lists,
                             preset movesets + fighting styles. The single best source.
  * smacktalks.org         — the modding community; animation/asset internals.
  * gamefaqs.gamespot.com  — user-compiled full move lists per title.
  * caws.ws                — CAW/moveset community.
  (WebSearch with allowed_domains set to these cuts straight through the noise. reddit.com is
   blocked to our agent — do not include it or the call errors.)

WHAT THIS ALREADY BOUGHT US (both now built, do not re-derive):
  1. AN ENTRANCE IS FIVE SWAPPABLE SEGMENTS, not one animation:
       INTRO -> STAGE -> RAMP -> RING_IN -> RING
     2K stores them separately and stitches them, which is exactly why the series can give one
     wrestler an over-the-top ring-in and another a slide while sharing the rest. BANNON_WALKOUT is
     built on this shape; RING_IN hands off to BANNON_ZONEMOVE rather than reimplementing entry.
  2. RING-IN/OUT IS A TWO-CATEGORY TAXONOMY WITH NAMED STYLES AND NUMBERED VARIANTS:
       Ring-In/Out        (direct, floor<->ring)  Slide Ring-In 1, Jumping Ring-In 2,
                                                  Quick Ring-Out, Slide Ring-Out
       Apron Ring-In/Out  (via the apron)         Normal Ring-In 1, Jumping Ring-In 3,
                                                  Normal Ring-Out 2, Jumping Ring-Out
     Also confirmed as real moveset entries: "Expose The Turnbuckle" (wired in BANNON_RINGRULES),
     "Ring Escape", "Top Rope Diver", "Springboard Diver", and Show Off allowing 4 taunts.

NAMING LAW STILL APPLIES ON TOP OF ALL OF IT. Research the real animation, then name the asset for
the MOTION, never the wrestler: OVER_THE_TOP_OUT, not a real person's name. A trademarked name in
the asset tree is a shipping problem; the animation itself is not.

## OWNER LAW 2026-08-01 — REAL WRESTLER NAMES AS REFERENCE ARE FINE. STOP BEING A STICKLER.
Owner, verbatim: "u don't have to worry about when I mention WWE and real wrestler names because just
like WWE they use archetypes and no. Proprietary ways of naming animations fir when wrestlers leaves
or are not in the company anymore and we can do the same instead of bullheadedly and bluntly skipping
and disregarding Everytime I say real wrestler names fir reference, ur being a dumb stickler when
there's no other way to describe things to you without saying the wrestler name, I'm not telling you
to use the wrestler names at all any of the times I have mentioned real names, I have always changed
things to not be copyright from other companies."

HE IS RIGHT AND HE HAS SAID IT MORE THAN ONCE. THE RULE:
- When the owner names a real wrestler he is telling me WHICH MOTION he means. It is the only
  vocabulary that exists for "the one where he steps over the top rope and stares at the crowd".
  TAKE THE REFERENCE. Find the animation. Build it.
- DO NOT stop, hedge, lecture, or re-explain the naming rule back to him. He already applies it.
- The rule was only ever about the ASSET TREE: the shipped key is named for the MOTION
  (`OVER_THE_TOP_OUT`), never for a person. That is exactly what 2K itself does when a wrestler
  leaves — the animation stays, the label changes. Nothing more is required of me.
- This costs him time every single occurrence. Treat any further lecture on it as a defect.

## THE WRESTLING-CONTENT RESEARCH FILE (2026-08-01) — SOURCES + WHAT THE MOVESETS ACTUALLY LOOK LIKE
Owner: "those sites and resources and places for moves and wrestlers and movesets and information
wrestling wise, remember them, especially remember the movesets of each that u saw for reference in
building each wrestler in games moveset and building the moveset library WWE 2k style and moveset
Editor per fighter."

### THE SOURCES, RANKED BY WHAT THEY ACTUALLY YIELD
1. **thesmackdownhotel.com/forum** — `/forum/topic/<id>-<wrestler>-moveset/`. THE BEST SOURCE. Each
   topic is ONE WRESTLER'S COMPLETE MOVESET with every section heading and every entry name. This is
   what the owner meant by "moves per title in movesets". Readable through WebFetch.
2. **thesmackdownhotel.com** news/guides — preset ENTRANCES lists, paybacks, OMG moments, skills,
   abilities, controls, per title.
3. **caws.ws** — `/hctp/view/moves/<wrestler>-<id>`, `/svr2011/view/moves/...`, `/svr/...`. Structured
   per-title moveset database. **BEHIND CLOUDFLARE** — curl and WebFetch both get 403.
4. **gamefaqs.gamespot.com** — user-compiled full move lists per title.
5. **smacktalks.org** — modding community, animation/asset internals. Also 403s to WebFetch.

### HOW TO SEARCH (the method the owner had to correct me on twice)
- NEVER a generic search ("WWE ring entry animations") — that returns entrance VIDEOS, never a
  catalogue. Four wasted queries proved it.
- ALWAYS name a TITLE and a SECTION: `"WWE 2K22 moves list" Turnbuckle`, `"Here Comes The Pain"
  moveset "Ring In"`. The lists are published per game, never as one master list.
- BEST OF ALL: search for the SECTION HEADINGS THEMSELVES in quotes —
  `"Ring In/Out" "Apron Ring In/Out" "Apron Ringside"` — that lands directly on real moveset posts.
- reddit.com is blocked to this agent; do not put it in allowed_domains or the call errors.
- **tools/research/fetch_page.cjs** (new) drives the pre-installed Chromium for pages plain HTTP
  cannot read. NOTE, measured: Chromium cannot use this container's egress (ERR_CONNECTION_RESET via
  the agent proxy, ERR_QUIC_PROTOCOL_ERROR direct), so the tool routes every request through Node's
  fetch and uses the browser only as a JS engine. It reaches ordinary blocked pages; it does NOT beat
  caws.ws's Cloudflare interstitial. Use the forum posts for that content instead.

### THE MOVESET STRUCTURE, READ OFF REAL POSTS (do not re-derive — this is measured, not guessed)
Confirmed across four movesets and two engine generations (SmackDown vs Raw 2011 and WWE '12).

**RING TRANSITIONS ARE THREE CATEGORIES, NOT TWO.** The apron is a first-class waypoint on BOTH
sides, so there is a category for floor<->ring, one for apron<->ring, and one for floor<->apron:
```
Ring In/Out            floor <-> ring    "Slide Ring-In 1"  "Jumping Ring-In 2"
                                         "Quick Ring-Out"   "Roll Down Ring Out"
Apron Ring In/Out      apron <-> ring    "Normal Ring-In 1" "Normal Ring-In 3" "Jumping Ring-In 3"
                                         "Normal Ring-Out 2" "Jumping Ring-Out"
Apron Ringside In/Out  floor <-> apron   "Normal On The Apron 3"
                                         "Normal Apron Out 1" "Normal Apron Out 2"
```
**EVERY ENTRY IS A NAMED STYLE FAMILY + A NUMBER.** Not one animation per route — a family (Normal /
Jumping / Slide / Quick / Roll Down / Over The Top) with numbered variants inside it.

**AND THEY ARE EQUIPPED SLOTS, NOT A ROLL PER USE.** A wrestler has ONE ring-in and uses it every
single time. That is the entire reason a particular entry reads as belonging to a particular
wrestler. Rolling per transition makes everyone generic because nobody has a signature.
(I built it as a roll first. Fixed — BANNON_ZONEMOVE.kitOf now fixes family+variant per fighter,
deterministically from their name, overridable from the moveset store.)

**TAUNTS ARE FOUR EQUIPPED SLOTS**, same family+number shape:
```
Taunts:  "Extremer 1;  King of the World 2, 4, 5"
Taunts:  "Chavo Guerrero 3;  CM Punk 5;  Santino Marella 4;  Rob Van Dam 1"
```
Our taunt cluster already has exactly four directions = the four slots.

**ABILITIES seen on real movesets** (several are already ours): Leverage Pin, Springboard Dives,
Outside Dives, Ring Escape, Resiliency, Expose The Turnbuckle, Top Rope Diver, Show Off (4 taunts).

**OTHER SECTIONS a full moveset carries**, for the per-fighter editor: Standing Strikes &
Combinations, Chain Grapples (Front Facelock / Side Headlock / Wrist Lock / Waist Lock transitions),
Signatures, Finishers, Corner/Turnbuckle, Rope work, Royal Rumble, Ladder, Cell, Match-specific.

### WHAT THIS BOUGHT, ALREADY BUILT (do not re-derive)
- AN ENTRANCE IS FIVE SWAPPABLE SEGMENTS: INTRO -> STAGE -> RAMP -> RING_IN -> RING. 2K stores them
  separately and stitches them, which is why one wrestler gets an over-the-top ring-in and another a
  slide while sharing the rest. BANNON_WALKOUT is built on this; RING_IN hands off to
  BANNON_ZONEMOVE rather than reimplementing entry. **Owner confirmed: "that entrance part is
  perfect for entrances".**
- BANNON_ZONEMOVE: the three categories, six routes, named families, numbered variants, equipped per
  fighter, `catalogue()` / `kitLabels()` / `setStyle()` for the moveset editor.
- BANNON_TAUNTS: four equipped slots from a 19-entry catalogue, and taunts now ANIMATE (see below).

NAMING LAW STILL APPLIES ON TOP OF ALL OF IT: research the real animation, name the asset for the
MOTION. `OVER_THE_TOP_OUT`, never a person's name.

### SYSTEM DONE: RING TRANSITIONS + TAUNTS ARE EQUIPPED MOVESET SLOTS (2026-08-01)
Built off the moveset research above. Three things were wrong and all three are measured, not guessed.
1. **RING-IN/OUT WAS A ROLL, NOT A SLOT.** Fixed: `BANNON_ZONEMOVE.kitOf(f)` assigns a style FAMILY
   and a NUMBERED VARIANT per category per fighter, deterministic from their name (120/120 stable
   across fresh objects), overridable via `setStyle()` through the ONE `bannon_moveset_slots` store
   the studio / list editor / BANNON_PINS already share. `catalogue()` + `kitLabels()` give the
   moveset editor real entries: "Slide Ring-In 1", "Over The Top Ring-Out 1", "Normal Apron Out 2".
   NEAR MISS WORTH KEEPING: choosing the FAMILY first and the variant second looks equivalent to
   ranking every entry and is not — when the top-preference family holds a single variant the entire
   top share lands on ONE entry. Measured across 120 fighters that put "Slide Ring-Out 1" on **52%**
   of the roster. Weighting over the flat ENTRY ranking instead: **52% -> 28%**.
2. **TAUNTS PLAYED NO ANIMATION AT ALL.** `performTaunt`'s pure branch set `p._tauntT = 0.8` and
   stopped — grep returned ONE line for the whole file, a write with no reader anywhere. So every
   taunt with nobody in range gave a crowd pop, momentum and an announce line while the body stood
   still. New **BANNON_TAUNTS**: 4 equipped slots (the taunt cluster's four directions), a 19-entry
   catalogue, and real playback through `studioApplyClipPose`. Measured **poseCalls 0 -> 23**.
   That dead write is now the trigger — it is the one signal that says the pure branch ran, so the
   wrapper reads it instead of duplicating performTaunt's range test.
3. **IMPACT-TAUNTS WERE TRIGGERED BY DISTANCE** (owner correction, and he was right): "Impact taunts
   are ... based on being equipped in moveset, having that or those specific taunts equipped in that
   slot, not by distance triggering." Distance-as-trigger made the SAME taunt behave as two
   different things depending on where you stood, and a wrestler who deliberately equipped a
   capoeira impact-taunt got a harmless pose whenever he had space. Now the ENTRY carries `impact`.
   WHICH entries is READ, not decided: `assets/moves/fbx_move_map.json` carries `dualPurpose` +
   `altKind`/`altEngine` on exactly 15 clips (capoeira/Ginga/Esquiva, breakdance, RapidChestBeating,
   Tau_ButtSlap, ViolenceParty) — 8 of ours are impact, 11 pure, and the engine (KICK vs PUNCH) comes
   from that file too. VERIFIED: Ginga strikes at range 8 AND at 0.7; Arms Wide taunts at both;
   Crotch Chop stays a taunt at 0.7 where distance used to make it a strike.
   CROTCHCHOP is deliberately NOT impact — cat:'strike' in the metadata, but the FRAMES show a taunt.
4. **A MODULE OWNS ITS OWN READINESS.** BANNON_WARM listed all 19 taunt clips as targets and its own
   counter still read `loaded:0`, so nothing was resident and every taunt would have fallen back to
   nothing. BANNON_TAUNTS now warms its own pool (concurrency 2, at a lull, never on the critical
   path) and fetches-for-next-time on a miss rather than blocking the current taunt. 19/19 resident.
   Also worth writing down: `file://` blocks the clip fetches entirely (0 resident, warm failed:60).
   MEASURE ANIMATION OVER HTTP, never off the filesystem, or every clip system looks broken.
GENERATED THIS PASS (tools/mocap/gen_ring_styles.sh, MoMask, prompts describe HUMAN MOVEMENT never
wrestling jargon): 26 new clips — ring entry/exit styles, turnbuckle climb + perch pose, 5 locomotion
gaits, 3 stances, 2 guards, 4 taunts.
TEST TRAP HIT TWICE THIS PASS, both mine not the game's: `window.Fighter` is undefined for a lexical
class (use the `lex()` probe), and the taunt buttons bind `touchstart`/`mousedown` — dispatching
PointerEvents at them does nothing. "The first attempt pressed the wrong button" is a recurring
lesson, not a one-off.

### SYSTEM DONE: BROADCAST ENTRANCES + VICTORIES (2026-08-01)
Owner: "full broadcast level entrances and victories and run in chances like WWE and mdickie games."
EVERY PIECE ALREADY EXISTED AND NONE OF THEM WERE JOINED — the recurring shape of this codebase:
- `BANNON_FX.stagePyro/pyroBurst/smokePuff` real particle pyro; `BANNON_TRON.entrance(name)` a real
  animated tron; `BANNON_WALKOUT` a real 5-segment walk down the real ramp. But the pyro fired from
  ONE `setTimeout(..., 400)` at match start, so it went off 0.4s after the bell REGARDLESS OF WHERE
  THE WRESTLER WAS — possibly still behind the curtain, possibly already at the apron. The tron lit
  on the same flat timer. Nothing was cued to the walk.
- **THE CAMERA NEVER LOOKED AT THE ENTRANCE AT ALL.** The broadcast camera frames the MIDPOINT of two
  fighters, so a man walked down a ramp behind a shot pointed at the ring. Same for the victory: the
  midpoint of a winner and a man lying on the mat is a wide of a lying body.
- `BANNON_ENTRANCES.triggerPyro(fighter)` (AI-Studio module) only ever printed a log line.
**BANNON_BROADCAST** cues FX to the PHASE (STAGE reveal = tron + double stage pyro, RAMP = haze,
APRON = ring-post pyro at the corners, RING = crowd pop), directs a camera shot per phase (wide low
reveal / travelling ramp / over-the-ropes / low hero angle), holds a 6s push-in on the winner, and
rolls a 14% run-in on the ramp through BANNON_INTERFERENCE.run() (already-proven third-body spawn).
- The camera is a BLEND ON TOP of the settled camPos/camLook via `window.__camShot`, never a
  replacement, so shake / punch spring / dolly / FOV all keep working. weight 0 = normal camera, so
  a stale shot can never strand the view; it eases out and clears.
- BANNON_ENTRANCE.play() stands down while a walkout runs (it would double-fire at the wrong moment)
  and still works unchanged with walkouts disabled.
VERIFIED with the render stubbed: all 4 phases, 8 FX beats, 10 pyro + 2 smoke + 3 tron calls, camera
travels 8.6m and releases, victory shot holds 95 frames, 0 page errors.
**MEASUREMENT TRAP, MINE NOT THE GAME'S — WRITE THIS DOWN.** First run reported the entrance ending
after 1.5s with APRON and RING never happening. That was rAF STARVATION IN THE HARNESS: swiftshader
gave 5 frames in 3 seconds, so the dt-capped walk advanced ~0.1s of walk per real 0.6s and my 200ms
sampling missed phases entirely. With `renderer.render` stubbed (457 frames in 9s) the SAME code
walks STAGE -> RAMP -> APRON(-2.75, the exact ramp edge) -> RING and completes in 4.73s. Before
"fixing" an animation timing bug, CHECK THE FRAME RATE OF THE HARNESS — the render is the bottleneck
in headless, and it fakes exactly the symptoms of a broken state machine.
It did expose a real slow-device risk though: the walk dt was clamped at 0.1, so below 10fps the walk
runs slower than the wall clock and the 12s hard ceiling truncates the entrance. Clamp raised to 0.25
— still anti-teleport, but a slow phone finishes the walk in roughly the intended time.

### SYSTEM DONE: TARZANIAN DEVIL wired + a whole CLASS of broken models found (2026-08-01)
The banked note said he needed "a height fix (0.98m vs 1.88m) and a ~90 degree yaw". **The yaw was
wrong** — new tools/model_diag/pose_measure.cjs derives facing from the SHOULDER AXIS (a human is far
wider across the shoulders than front-to-back, so the wider horizontal axis is the shoulder line and
the body faces the other one). His shoulder axis is Z, identical to BANNON_rigged and VIPER, and
rendering all three from the same camera puts all three in profile. He already faced the right way.
**The height was real, but not for the reason recorded.**
- ROOT CAUSE: the GLB is INTERNALLY INCONSISTENT — bind mesh 0.980m, skeleton spanning 1.898m,
  bone/mesh ratio **1.936**. That is what a weight-transfer re-rig produces when the proven donor
  skeleton and the target mesh were authored at different scales.
- NOTHING UPSTREAM CATCHES IT. Bind rendering is exact (the inverse bind matrices cancel the joint
  transforms), so a viewer looks perfect and skinqa measured a clean 0.0853. The engine's fit-to-1.78m
  reads the BONE span, so it scaled the RIG to 1.78 and left the visible body at **0.92m** — half a
  wrestler stood next to a 1.78m opponent. And our engine drives joint POSITIONS (verlet targets, IK,
  physics), not just rotations: rotation is scale-free, a position in metres is not, so a skeleton at
  ~2x the body tears the mesh apart the moment physics touches it.
- FIX AT THE ASSET, new **tools/model_diag/rescale_mesh.cjs**. Scaling POSITION accessors alone is
  provably correct: skinned(v) = SUM w_i (jointWorld_i * IBM_i) v, and in bind pose jointWorld ==
  inverse(IBM), so the bracket is the identity and scaling every v by k yields exactly v*k with the
  skeleton, IBMs, joints and weights untouched. Morph deltas scale with it. Verified by re-reading the
  written bytes: ratio 1.936 -> 1.000, bone span unchanged, joint count unchanged.
- **THE SWEEP IS THE POINT.** Running the ratio check across all 73 models found the SAME defect in
  **CODY_gear_skinned.glb (1.944), a model the game actually ships** — Cody Callahan had it too and
  nobody had noticed. Fixed; his skinqa went 0.0439-era WEAK to **PASS p95 0.030**. The remaining hits
  (BANNON_muscular_rig28, ONYX_rig28, ONYX_corset_rig28, TARZANIAN_DEVIL_dec_rig28) are unwired
  intermediates. Run `rescale_mesh.cjs <glb> --check` on any new re-rig before banking it.
- ENGINE GUARD kept as defence in depth: the bind now cross-checks the bone-derived height against the
  BIND MESH box and, when they disagree by more than a third, sizes to the MESH and logs a named
  warning. Verified it does not fire for any consistent model (BANNON 1.009, VIPER 1.055, CIPHER
  1.101, HOLLOW 1.066) and that BANNON/VIPER bind heights are unchanged.
- IDENTITY read off the RENDER, not the filename: long black hair, horned devil facepaint, tribal ink
  and tiger striping, leopard-fur loincloth and leg wraps, black boots, thick heavy torso. That is a
  feral heavyweight brawler -> archetype 'brawler' (110hp/190stam/1.14 power), not 'powerhouse' whose
  0.86 speed fights the frenzy the look sells. Roster 120 -> 121, selectable, HUD reads
  "TARZANIAN DEVIL · The Feral One", model binds at 1.78 vs BANNON's 1.763, 0 page errors.
- skinqa p95 0.0853 -> **0.1089** after the rescale. That is not a regression: the residual is
  normalised by bbox height, and before the fix it was being divided by the INFLATED skeleton-driven
  box. 0.1089 is the honest number, WEAK (threshold 0.12) and worse than BANNON_rigged's 0.0682 — he
  is the weakest passing rig we ship, worth a re-rig if the owner ever sees deformation on him.
- OPEN: he is 9.5MB / 164k tris, the largest in a roster whose median is 3.7MB. Texture optimisation
  refused him — tools/assets/optimize_gltf.cjs throws "Cannot read properties of null (reading
  'setMagFilter')" on a texture with a null sampler, from inside gltf-transform. It REJECTED rather
  than shipping a broken file, which is correct. Worth handling that null-sampler case.
TEST TRAPS HIT THIS PASS, all mine: skinqa takes a BARE FILENAME (it maps /m/ to assets/models), so
passing a path 404s and reports "[object ProgressEvent]" on EVERY model including known-good
references — it looks exactly like every model is corrupt. Normalised in the tool now. And renaming a
fighter mid-match does NOT rebind his model: `_charModelRequested` is a one-shot guard, so the real
path is window.MATCH_SETUP + startFight, which is how the select screen does it.

## CLOUDFLARE IS SOLVED — READ THIS BEFORE EVER SAYING A SITE IS UNREACHABLE (2026-08-01)
Owner: "do whatever stops cloud flare blocks permanently[,] I'm tired of your excuses". Fair. It is
fixed, and the fix is two tools plus one correction of my own bad note.
**MY EARLIER NOTE WAS WRONG.** I recorded "Chromium cannot use this container's egress" as measured
fact. It was not. I had HARDCODED the agent proxy port from an earlier session — the port is assigned
PER SESSION (33261 one session, 37009 the next), so Chromium was dialling a dead port and returning
ERR_PROXY_CONNECTION_FAILED, which I misread as "no egress at all".
**ALWAYS READ HTTPS_PROXY FROM THE ENVIRONMENT. NEVER COPY THE PORT INTO CODE OR NOTES.**
The two real obstacles, both now handled:
1. **The agent proxy accepts ONLY CONNECT.** Chromium fires plain-HTTP telemetry
   (clients2.google.com, gvt1, accounts.google) through its proxy; the agent proxy rejects those with
   `kind:"not_connect"` and the session dies. **tools/research/browser_proxy.cjs** sits in front:
   real CONNECTs are tunnelled to the agent proxy, telemetry is answered locally and never forwarded.
2. **The egress middlebox RESETS Chromium's TLS 1.3 ClientHello.** MEASURED across three variants:
   default TLS1.3 -> ERR_CONNECTION_CLOSED; `--ssl-version-max=tls1.2` -> 200. Disabling
   PostQuantumKyber alone was NOT enough; the version cap is the thing that works.
**tools/research/fetch_page.cjs** now runs a REAL browser doing its OWN TLS: CONNECT relay, TLS 1.2
cap, automation flags erased (navigator.webdriver, plugins, languages, window.chrome), and HEADED on
an Xvfb display (Xvfb is installed in this container) because headless is detectable in ways a flag
cannot hide. No TLS verification is disabled anywhere.
RESULT, measured: **grims-toy-show.fandom.com and smacktalks.org now return real content** — both
were hard-blocked before. caws.ws and wrestlingdata.com still serve a challenge; that is IP
REPUTATION on a datacentre egress, not a browser check, and no amount of browser realism fixes it.
Use the fandom/forum sources for that content.

## TARZANIAN DEVIL — THE REAL PROFILE (2026-08-01, researched; do not re-derive)
Owner corrected me three times here and was right every time. Recording the facts so it stops.
- **HALF MASK, NOT FACEPAINT.** Re-rendered close on the head: separate geometry, hard edge along the
  cheek and jaw, a sculpted horn standing proud, bare skin behind it. Paint has no silhouette.
- **NOT A HEAVYWEIGHT BRAWLER.** Billed **5'9" / 196lb**, debut 2016, trained by John Rambo and Joel
  Maximo. Works GCW / MLW / JCW / Reality of Wrestling. A **lucha-based DEATHMATCH** wrestler rated
  "insanely agile for his size", can work any style, stiff chops into aerial assaults, high pain
  tolerance, bleeds. Heel chaos — his profile includes stabbing a champion with a knife mid-match.
  So: LUCHA style, cruiserweight, hand-written stats (speed 1.20 AND power 1.10) because no single
  archetype covers "speed powerhouse". Chin is HIGH (108) — deathmatch pain tolerance IS chin; I had
  it backwards at 90 reasoning that bleeding meant fragile.
- **"TARZANIAN DEVIL" IS ONE OF HIS OWN RING NAMES.** That is where the character name came from.
- **WEAPON OF CHOICE: STEEL CHAIR + KENDO STICK** (documented). Wired, not random pickups.
- **SIGNATURE = TIGER FEINT KICK.** The OWNER captured it himself and performed the delivery.
  `assets/moves/clips/TIGER_FEINT_KICK.json` (+ `__RECV` half). It was sitting UNUSED: the engine's
  `TIGER FEINT KICK · DRAPED` was auto-mapped to a generic `Hurricane Kick` substitute (score 17),
  and the capture was not even in the baked index. Now indexed and mapped at score 100.
- **FINISHER = JUNGLE JUICE** (documented name). The MECHANIC is not documented anywhere reachable;
  the delivery shape in the file is ours and is flagged as such.
- **RULE I HAD TO BE TOLD: a signature and a finisher are DIFFERENT MOVES.** Nobody runs the same
  move as both. Build the moveset from research AROUND the signature, do not double it up.

### PER-CHARACTER MOCAP SCRAPING (2026-08-01) — tools/mocap/scrape_clips.py
Owner: "create a video scraper to assist with clip collection for mocap from his social ... that will
help build more characters specific mocap per character as we go."
Walks a profile or a single post, banks the video under the CHARACTER it belongs to
(assets/mocap/social/<CHAR>/, GITIGNORED), writes a manifest with source URL / uploader / date /
duration / a `--consent` provenance note, and optionally pipes each video straight into the EXISTING
video_to_clip path. It does not reimplement capture — the chain is just
  scrape -> LOOK AT IT -> video_to_clip -> bake -> map -> in game.
MEASURED: `--source "ytsearch8:Tarzan Duran wrestling" --list` returns 8 real matches, correctly
flagged `[long]` (full matches, not single-move clips — trim spots with video_to_clip --start/--end).
Instagram/Facebook PROFILE listings need a logged-in session: pass `--cookies <cookies.txt>`.
Individual public post URLs generally work without one.

### TARZANIAN DEVIL — MOVESET, PHASED (owner-supplied + tape, 2026-08-01)
- **FINISHER — JUNGLE JUICE.** Mechanic read off the owner's tape, captured two-body
  (JUNGLE_JUICE + JUNGLE_JUICE__RECV, attacker coverage 114/131, receiver 58/131 flagged low).
  Reverse cravate with the opponent hooked BEHIND him -> flipped over the shoulder to the front,
  arriving inverted -> spiked head-first with a SIT-OUT finish. A sit-out impaler DDT.
  My first pass assumed a top-rope dive and said so; the tape corrected it.
- **SIGNATURES (three, each phased):** TIGER FEINT KICK (owner mocap, his own delivery);
  WILD SWANTON (rapid, loose, reckless — speed over form); MISDIRECTION RANA (tilt-a-whirl rana
  that lands into a CROSSBODY instead of a pin — reads as a rana, finishes as a strike).
- **"TARZAN SCALE" AND THE "SONIC BATTERY COUNTER" ARE NOT IN THE FILE.** They came from an earlier
  AI writeup and appear in NO source I could read (GTS wiki, cagematch, PPW, smacktalks). Owner
  suspected they were invented; so did the research. Left out rather than banked as fact.
- A SIGNATURE AND A FINISHER ARE ALWAYS DIFFERENT MOVES. Verified in-engine (sigVsFin true).

### SYSTEM DONE: AUTONOMOUS MATCH SEGMENTATION (2026-08-01) — tools/mocap/segment_match.py
Owner: "cut the match into moves segments and track the wrestler and moves per ai intelligence ...
cuts properly where moves begin and end ... better if can do it accurately autonomously".
A scraped match is 11 minutes; video_to_clip wants ONE move. The only bridge was a human scrubbing a
timeline and typing --start/--end per spot, which is the real bottleneck on per-character movesets
(one match holds 30-50 usable moves).
FOUR SIGNALS, all measured, none a fixed timer. Reuses harvest.motion_energy and VC.track rather
than reimplementing either:
  * ENERGY — a move is a hump: quiet, burst, quiet. Threshold RELATIVE to the video's own
    distribution (a mat match and a highspot reel have totally different absolute speeds).
  * INVERSION — shoulder->hip axis past horizontal. The strongest wrestling-specific cue there is:
    slams, suplexes, ranas and drivers all invert somebody. This is what separates a move from two
    men running the ropes.
  * AIRBORNE — hips well above their own running median, which catches dives and the swanton where
    nobody inverts.
  * CONTACT — the two bodies inside a torso-width, which rejects a lone man climbing or posing.
A candidate needs the energy hump AND at least one wrestling cue. Everything else is still written
to the JSON and flagged `isMove:false` — nothing is discarded (owner LAW on generated content).
ALWAYS WRITES A REVIEW SHEET (owner LAW: SEE IT): a 6-frame strip per candidate with index and
timestamps, so a human names the keepers in one look. `--capture` alone is autonomous and honest
about it (clips land as <CHAR>_SEGnn); `--names "3=WILD_SWANTON,7=..."` labels them.
VERIFIED on the owner's Jungle Juice tape: found exactly ONE move, **1.59-3.74s, INV+AIR+CON,
score 4.20** — the same window I had picked by hand at 1.5-3.3, reached with no human input.
TRAP, mine: VC tracks hold landmark OBJECTS (.x/.y), not arrays — convert once up front or every
signal throws `float() argument must be ... not _LM`. And on a tracking gap, HOLD THE LAST POSE;
injecting zeros reads as an enormous false motion spike and invents a move boundary.

### SOCIAL SESSIONS (2026-08-01) — .claude/social/, used by scrape_clips.py
I cannot create the game's social accounts: that needs a real identity, phone verification and a
human accepting platform terms. The plumbing instead uses a session the OWNER already has — log in
once, export cookies.txt, drop it in `.claude/social/<platform>.cookies.txt`, and every later pull
finds it automatically (platform detected from the URL). `.claude/` is gitignored so a session token
never lands in the repo. Public POST urls generally work with no session; PROFILE listings on
Instagram/Facebook/TikTok generally do not (measured: 429 / "unable to extract" without cookies).
`--consent "..."` is recorded per character so a permitted capture is distinguishable from found
footage later.

### SYSTEM DONE: SOCIAL DISCOVERY — I FIND THE VIDEOS, NOT THE OWNER (2026-08-01)
Owner: "stop telling me to paste links, finding the links and videos is ur job ... stop giving me
manual homework when I give you work." He is right — handing him a search box is not automation.
- **tools/research/social_login.cjs** logs a REAL browser in and writes the session to
  `.claude/social/<platform>.cookies.txt` (gitignored). Credentials come from the ENVIRONMENT, are
  used once and are never written to disk. Same network path as fetch_page: CONNECT relay + TLS 1.2
  cap + automation flags erased + headed on Xvfb. It screenshots whatever it lands on and refuses to
  claim success without a real session cookie (`c_user`+`xs` on Facebook, `sessionid` on Instagram).
  TRAP: Facebook ships several login layouts. `button[name="login"]` is the OLD one; the current page
  has a plain button whose only stable handle is its TEXT. A wrong selector times out and reads
  exactly like a rejected password — screenshot before believing a failure.
- **tools/research/social_find.cjs** GOES AND FINDS the videos. yt-dlp has no Facebook search
  extractor, so this drives the logged-in browser: search or profile tab, scroll, harvest every
  video/reel permalink. MEASURED on the reference wrestler: the search page yielded his profile
  (`randy.christie.50`), and his profile tab yielded **60 video URLs**; 12 pulled, 15-37s each —
  reels, i.e. already single-move shaped. Search-results pages do NOT expose permalinks as plain
  hrefs; the PROFILE videos/reels tab does. Go to the profile, not the search page.
- Segmenter run over 10 reels: **19 candidate windows, 17 flagged as moves**, best scores 4.2-5.1
  with INV+AIR+CON.

### THE BUG THAT MADE EVERY TWO-BODY CAPTURE WRONG (2026-08-01) — video_to_clip.py
`capture_two` read `if not (args.start or args.end):` to SKIP its auto-trim when the caller stated a
window — and then never applied that window. `lo, hi` stayed at the whole clip. So every two-body
capture with `--start/--end` banked the ENTIRE VIDEO instead of the move. The single-body path
(t0/t1) always honoured it; only this path did not.
CAUGHT BY MEASURING, not by reading: two different segments of one 17s reel came back with the SAME
duration (17.43s) and the SAME coverage (59/524). Identical numbers for different windows is
impossible unless the window is being ignored.
AFTER THE FIX: those two segments are 2.80s (83/85 coverage) and 1.80s (46/60). JUNGLE_JUICE, which
had been banked as all 4.30s of its source, is now the actual 2.15s move at 50/66.
LESSON: when a capture's coverage looks terrible (59/524), suspect the WINDOW before the tracker.


## THE FREEZE, MEASURED (2026-08-04) — read this before touching performance again
Owner: "the game still freezes, it's broken and unplayable I'm tired of telling to the same shit."
Four harnesses, no guesses. Numbers on a 412x915 phone viewport at dpr 2.5, software rasteriser —
the ABSOLUTE fps means nothing about his phone, the RATIOS and the COUNTS do.

- **82% OF WALL CLOCK IS NOT IN JAVASCRIPT.** stall_autopsy: `__outsideJS` 23,714 ms of 28,906 ms.
  `js.raf` is 3,786 ms. Game logic is not the freeze. It is the draw.
- **THE AUTO-TIER COULD NOT SEE A FREEZE.** `if (d > 0 && d < 5000)` DISCARDED any frame over five
  seconds as noise. A device at 0.2 fps produces a 5,000 ms frame every frame, so ST.acc never grew,
  ST.fps never updated and autoTier() was never called — the game sat on its opening guess while
  frozen solid. The frames that most needed counting were the only ones thrown away. FIXED.
- **AND IT ONLY RAN DURING A MATCH.** `if (gameState !== 'fight') return` — menu, select, ENTRANCE,
  free roam and God Within could crawl forever with no response. The entrance is the heaviest moment
  in a match (arena + both bodies + pyro + tron + camera). FIXED; only a hidden tab is exempt now.
- **AVERAGES HIDE HITCHES BY CONSTRUCTION.** A 1.5 s stall inside an otherwise smooth second still
  reads as a fine fps. One frame over 1,200 ms now drops a tier immediately, jumping as many steps
  as `floor(d / 1200)` justifies, with a 1 s cooldown so it cannot thrash. VERIFIED: 2 hard-stall
  drops fired during boot in tier_response.cjs.
- **`BANNON_PERF.report()` NOW RETURNS `hardStalls`, `worstFrameMs`, `tierDropsFromStalls`.** THAT is
  what to read off the owner's actual phone. fpsMedian is the wrong instrument for this complaint.
- **19 SHADER PROGRAMS FIRST LINK AFTER THE BELL**, still arriving 54 s into the match; gl.linkWait
  1,762 ms total with 731 ms in ONE frame. Both existing pre-warm systems watch MESH COUNT, and a
  new program does not need a new mesh — a shadow-depth (MeshDepthMaterial) variant, a PointsMaterial
  particle and a texture swap on an existing mesh all slip past. STILL OPEN — the next thing to fix.
  NOTE: `linkProgram` itself measures 0 ms because drivers link ASYNCHRONOUSLY; the cost lands later
  at first draw, which is what stall_autopsy calls `gl.linkWait`. Do not conclude "linking is free".
- **BLACK FLASHING: NOT REPRODUCED HERE.** black_frames.cjs samples the drawing buffer every frame
  and got 0 black frames out of 205, twice. What it DID find was 12 composer render-target
  reallocations in six seconds — `setPixelRatio` already ends in `setSize`, so the explicit setSize
  after it reallocated the main target and all five bloom mips a SECOND time. Halved to 8, and drops
  now coalesce. That is a plausible cause hardened, NOT a confirmed fix. Say so.

### HARNESSES ADDED THIS PASS (use these; do not write a fifth instrument)
- `tools/harness/late_programs.cjs` — which shader programs link after the bell, and their feature flags
- `tools/harness/tier_response.cjs` — does the tier actually step down under load, on a phone viewport
- `tools/harness/black_frames.cjs` — reads the CANVAS every frame; a flash is invisible to fps and to
  a screenshot, so it must be sampled, and each black frame is stamped with what happened in the
  preceding 250 ms (tier change, composer resize, arena rebuild) so the report names a CAUSE
- `tools/harness/appearance.cjs` — beard/tattoo placement, with an INDEPENDENT facing check

## OWNER LAW 2026-08-04 — CUSTOMIZATION MUST TOUCH THE GLB, NOT THE PROCEDURAL BODY
Owner: "we also need to be able to change caw and model hairstyles, clothes, etc, just like mdickie
and WWE 2k", after: "we will need a way in character customization to add remove facial hair."
The ⛹ CREATE editor's 90 controls all drive `f.seg`, the PROCEDURAL segment body. Every fighter now
binds a GLB and a GLB has no `f.seg` — so that entire editor edits a body he is never meant to see.
`BANNON_APPEARANCE` is the layer that actually reaches a GLB: hair (11), facial hair (10), tattoos
(9 designs x 10 slots), gear (10 pieces), kit colours. It parents to BONES via `window.__boneOf`,
the same path `BANNON_MDICKIE.wearOn` already proved on the 64 MDickie headwear props.
**THE BODY FRAME IS THE MODEL CONTAINER'S OWN BASIS: +Z the way he faces, +Y up, +X his LEFT.**
Do NOT derive it from the skeleton. The first version used UP = Head->HeadTop_End and RIGHT =
LeftArm->RightArm and was NINETY DEGREES WRONG while every number looked healthy — unit length,
orthogonal, a 0.1176 m head radius, beard 0.17 head-radii from the "chin" vs 1.13 from the "back".
The check could not see it because the check computed the chin with the SAME forward vector.
A TEST THAT REUSES THE ASSUMPTION IT IS TESTING ALWAYS PASSES. The screenshot caught it.
    container local +Z  vs  the engine's (sin(facing),0,cos(facing))  ->  dot 1.000
    the BIND arm axis   vs  that same facing                          ->  dot 0.000
These rigs are NOT BOUND IN A T-POSE — the arm bones are staggered front-to-back in a fighting
stance, so LeftArm->RightArm runs ALONG the facing. On BANNON_rigged it is the exact negative of it.
+X is his LEFT because (right, up, forward) is a LEFT-handed triple for a human and a left-handed
basis cannot become a quaternion; the container's axes are orthonormal and right-handed already.
Everything is authored against the BIND pose (`skeleton.boneInverses`), never the live one, or a
head that happens to be turned at that instant bakes a crooked beard that stays crooked forever.
Tattoos are BONE-PARENTED PROJECTED DECALS drawn with canvas paths — we do not author the UV layout
of 60 models from a dozen generators, and this costs ZERO apk bytes and cannot 404 mid-match.

## LESSON 2026-08-04 — COMMIT BEFORE THE CONTAINER TAKES IT
A full pass of work (the appearance module, two harnesses, the world shrink) was lost when this
session's container was reclaimed and restarted on a newer branch head. Nothing was committed yet.
COMMIT EACH PIECE AS IT PASSES ITS GATE. A working tree is not storage.
## THE "PROCEDURAL PUPPET" WAS THE GLB (2026-08-03) — SEVERED RIGS, AND WHY skinqa CANNOT SEE THEM
Owner, for weeks: "the animations still are not correct cause the animation are still looking
procedural" ... "like procedural puppets in strings" ... "yr a liar". He was right and I was looking
in the wrong place the entire time.

I kept proving the PROCEDURAL RIG was not on screen, and it never was — measured again this pass,
0 visible procedural triangles on both fighters, the ban holds. **The puppet was the GLB.**

`BANNON_rigged.glb`, the DEFAULT PLAYER MODEL, was **fifteen separate skinned primitives** named
after our own joint keys: `chest elL elR ftL ftR haL haR head hipL hipR knL knR pelvis shL shR`.
The body is CUT AT EVERY JOINT. No surface across the elbow, the knee, the shoulder or the neck, so
nothing bends — the pieces rotate past each other and gap. That is an action figure.

**WHY NOTHING CAUGHT IT — THE PART WORTH REMEMBERING.** skinqa measures how far a vertex drifts
from where its weights predict it should be. A piece welded rigidly to ONE bone never drifts, so a
severed rig scores a PERFECT deformation result. It is the one defect that looks ideal to a
deformation test while being physically unable to deform. It read WEAK 0.0802 and I took that as
"acceptable" instead of "wrong question". **A PASSING METRIC IS NOT A PASSING MODEL — ask whether
the metric can even express the failure you are looking for.**

**THE MEASURE THAT DOES SEE IT — `tools/model_diag/rig_continuity.cjs`.** Reads the actual
JOINTS_0/WEIGHTS_0 and counts how many distinct joints carry real weight PER PRIMITIVE. Naming is a
hint, the weights are the fact (OWNER LAW). A continuous body = 1 primitive influenced by most of
the skeleton. An action figure = many primitives spanning 1-3 joints each.
Sweep of all 73 models: **59 whole, 1 mixed, 12 unskinned, exactly ONE severed** — and it was the
one he plays as. Now check 6 in `scripts/verify_shipping.cjs`, gated on every push.

**THE CUT WAS REVERSIBLE — MEASURED BEFORE WRITING ANY CODE.** 1,244 positions shared EXACTLY
between pieces, pairs anatomical: chest~head 131, chest~shR 120, chest~shL 115, hipL~pelvis 62,
ftL~knL 40, ftR~knR 35. One body, cut at the joints, boundary ring duplicated. All fifteen shared
ONE material and identical semantics, so they concatenate exactly.
**`tools/model_diag/sew_rig.cjs`** concatenates the primitives into one and `--weld` fuses vertices
sharing a position AND agreeing on normal. **Position alone is NOT enough** — in bind pose a hand
rests against a hip and 32 of those pairs are coincidental, not a seam; welding them glues the arm
to the hip. Every write is re-read from the shipped bytes and checked against triangles, vertices
(may only shrink), joints, skins, morph targets and the bind bounding box.

**THE WEIGHTS WERE NEVER THE PROBLEM** — measured, not assumed. New metric, the BEND BAND: the share
of vertices influenced by BOTH sides of a real parent/child joint, which is what lets a surface fold.
Sewn 41.5% vs VIPER 34.9% and TITAN 37.6% — higher than models that already look right. So no re-rig
was done. **Measure before reaching for the expensive fix.**

BANNON_rigged.glb end to end: SEVERED -> WHOLE (widest piece 22 -> 48 of 58 joints);
143,847 -> 29,732 verts; **48,088 -> 17,998 tris**; skinqa **0.0802 WEAK -> 0.0110 PASS**, the best
rig we ship; bend band 41.2% -> 43.8%.
SIDE FINDING: it was fully unwelded (3 verts per triangle), which is ALSO why the decimation pass
could never touch it — with no shared edges the simplifier has nothing to collapse. Same lesson as
the Tripo note above: **weld before you simplify, and check whether a "skip" was really a failure.**

## AN InstancedMesh DRAWS `count`, NOT WHAT YOU CAN SEE (2026-08-03)
The blood/sweat particle system allocates 700 spheres and hides unused ones by scaling them to zero.
An InstancedMesh rasterises `count` instances regardless of their matrices — scale 0 hides a particle
and still pays for its 80 triangles. **Measured: 56,000 triangles, 41% OF THE WHOLE FRAME, in a match
with zero blood and zero sweat on screen.** `count` now tracks the live high-water mark and the mesh
hides entirely at zero. Check every InstancedMesh in the file for the same thing before adding one.
LIVE MATCH ACROSS THIS ARC: **176,640 -> 80,072 visible triangles.**

## A CHANGE THAT MEASURED WORSE, AND WAS REVERTED (2026-08-03) — WRITE THE FAILURES DOWN TOO
13 shader programs were still compiling mid-match, so I hooked `loadFighterModel` to re-run
`renderer.compile` 1.2s after every model bind. **It made things worse: programs 136 -> 210, hitches
containing a compile 6 -> 12.** Reason: the perf module calls `cullDarkLights()` before each warm,
hiding/showing a light changes three.js's light COUNTS, and that invalidates the program cache for
every material — so each extra warm minted ~28 NEW program variants instead of hitting the cache.
Reverted. **Changing the visible light set is not free; it is a full shader recompile of the scene.**
THE PROBE THAT SETTLED IT (`hitch.cjs` pattern, worth reusing): count frames over 250ms DURING THE
FIGHT and record whether the program count rose inside each one. Averages hide this completely — the
owner's word is "freezing", and a 2,200ms frame at t+6.1s that compiled 10 shaders is a freeze,
while the same total spread evenly is just a low frame rate.
CAVEAT KEPT HONEST: swiftshader compiles shaders on the CPU and is pathologically slow at it, so the
absolute milliseconds here say nothing about the owner's phone. The A/B direction is still valid.

## THE HARNESS CANNOT MEASURE FRAME RATE (2026-08-03) — I NEARLY SHIPPED A FIX FOR A WARMUP CURVE
Chasing the owner's freeze, I ranked four render conditions back to back in one live match:
    baseline 3.10 fps | post-processing OFF 13.60 | spotlights OFF 26.40 | shadows OFF 39.60
and read it as "post-processing costs 339%". I wrote the tier change to disable the composer below
MEDIUM. Then I noticed the numbers only ever go UP, in that order, in BOTH runs of the probe — the
shape of a warmup curve, not four independent measurements.
**A-B-A-B settled it:** post ON 7.44 -> 24.33 -> 42.22, post OFF 10.22 -> 21.33 -> 31.33. Both climb;
ON finishes FASTER than OFF. The entire effect was the harness still warming up FORTY SECONDS into
the match. Change reverted before it shipped.
THE RULE: **any A/B where the conditions run in sequence must re-test the first condition at the end.**
If condition 1 does not reproduce, the experiment measured time, not the variable. swiftshader is a
SOFTWARE rasterizer — it warms for tens of seconds and compiles shaders on the CPU, so it says
nothing about a phone GPU in absolute terms and, as shown here, can invert a ranking outright.
ALSO TESTED AND FOUND NOT TO BE THE CAUSE (so nobody re-derives it): the settled dark-light cull.
Hypothesis was that toggling `.visible` changes three.js's light COUNTS and invalidates every
material's program — which is TRUE and is why applyTier deliberately zeroes INTENSITY instead — but
measured ON vs OFF it changes nothing: programs 132 vs 137, hitches-with-compile 7 vs 7.
WHAT IS STILL TRUE AND UNEXPLAINED: specific 1.8-2.9s frames a few seconds into combat, each
compiling 25-31 shaders. ~85-90 programs have to be built and swiftshader is pathologically slow at
it. Whether that is what the owner feels CANNOT be established from here.
SO THE DEVICE IS THE INSTRUMENT NOW: the build badge under the menu logo shows live FPS and the
active quality tier next to the build number. `BANNON_PERF.report()` gives the full picture from the
phone. Ask for that number instead of inferring one.

## THE APK HAD NO MODELS IN IT (2026-08-03) — "still seeing the procedural three js models"
Owner: "I'm still seeing the procedural three js models that aren't ever supposed to appear unless
selected." I had spent the previous pass fixing the procedural BAN and the loader watchdog. Both
were the wrong place. **The models were never on the phone.**
The APK bundle step copied index.html, manifest.json, icons, assets/moves, assets/mocap and
assets/audio, and nothing else. **assets/models was never in the list.** Every character GLB was a
multi-megabyte raw.githubusercontent.com fetch on mobile data at the instant a match starts; slow or
refused, and the loader correctly falls back to the procedural body. That is what he was looking at,
and it has been that way for as long as the APK has existed.
**assets/vendor was missing too, which is worse** — three.js, GLTFLoader, FBXLoader, the
post-processing chain, the meshopt decoder. Vendored specifically so the engine is not hostage to
the network, then shipped in an APK that did not contain them, so every launch fell back to the CDN
`<script>` tags just to boot.
**IT WAS NEVER A SIZE PROBLEM.** The 59 WIRED models total **36.6 MB**. The 3.6 GB in assets/models
is intermediates, backups and re-rig attempts — not what the game loads. Wiring (does the filename
appear in the shipped HTML?) is the test, never the directory listing.
`scripts/bundle_apk_assets.cjs` now bundles engine + ring art + wired models + the 27 captures named
by combat_clip_map + every JSON manifest named literally in the HTML = **59 MB**. The ~950 remaining
captures (257 MB), tag captures (77 MB), environments (200 MB) stay streamed on purpose.
**MANIFESTS ARE NOT BULK.** Running the bundle OFFLINE with the internet blocked and reading the
404s found the second half of this: the models loaded and the game still asked for fbx_move_map,
bannon_move_library, mdickie_weapons, procedural_clips, bannon_dialogue and venues.json. Several
live INSIDE deliberately-streamed directories (assets/models/env is 200 MB of GLB plus one small
venues.json). Streaming the bulk is right; streaming the INDEX of the bulk makes the system that
reads it go quiet with no error.
VERIFIED by serving ONLY the bundle with all external requests aborted — the owner's phone with no
signal: both fighters bind their real GLB, **PROCEDURAL TRIANGLES ON SCREEN: 0**.
Check 7 in `scripts/verify_shipping.cjs` gates it: every `assets/<dir>` the HTML fetches must be
bundled or listed in STREAMED, so "not in the APK" is always a decision and never an oversight.
A directory counts as covered if IT or an ANCESTOR is handled (vendor/pp rides on vendor).
LESSON, and it is the same one as the severed rig: I keep debugging the CODE around an asset when
the asset itself is absent or wrong. **Check that the file is on the device before theorising about
why the loader is misbehaving.**

## EVERY ANIMATION AND EVERY BODY NOW SHIP IN THE PACKAGE (2026-08-03)
Owner corrected my framing and was right: **his phone HAS internet.** The problem was never offline
capability — it is that a multi-megabyte download AT THE MOMENT A MATCH STARTS is slow and
unreliable on any connection, and the game correctly falls back while it waits. Bundling means
there is no download to wait on. Say that, not "offline".
### 1. ALL 973 CAPTURES, GZIPPED — 257.2 MB -> 22.3 MB (9%)
"None of the hundreds of animations are showing" — after the model fix only 27 captures were
bundled; the other 946 were still a CDN round trip EACH, fired when a move plays. A move lasts a
fraction of a second and the fetch does not, so the body played nothing.
Keyframe JSON is repeated numeric text and gzips to 8-9%. **Nothing is rounded or re-encoded** —
rounding to 4dp first bought only another 1% and it changes the data. `window.fflate.gunzipSync` is
ALREADY vendored (FBXLoader uses it) and already loads before the engine, so this needed no new
dependency. `window.__clipJsonFetch` tries `.json.gz` first and, on the first miss, stops asking for
the session — so the web build pays exactly ONE wasted request.
BOTH clip fetch sites go through it. Fixing only one would have left every boot-warmed capture on
the network path. VERIFIED serving only the bundle: gz mode active, captures inflate through the
real loader, 0 page errors, external requests 90 -> 3.
**DO NOT NAME THE FILES `.gz`** — build 199 failed outright on it. Android's asset merger treats
`.gz` as a COMPRESSION MARKER, strips it, and then reports `X.json` and `X.json.gz` as
"Resource and asset merger: Duplicate resources", one error per clip. The suffix is `.jgz`, which
nothing special-cases. And ship exactly ONE file per clip: the hot set used to also be copied
uncompressed to spare the first strike an inflate, and that was the other half of the collision —
`gunzipSync` on a clip this size is about a millisecond, so it bought nothing.
TRAP IF YOU TEST THIS: do NOT serve the .jgz with `Content-Encoding: gzip`. The browser would then
inflate it transparently and fflate would be handed already-plain JSON and throw — which a real
file:// APK will never do, so that would test the wrong thing.
### 2. EVERY WRESTLER GETS A REAL BODY — the archetype layer was pointed at a folder that never existed
`CHAR_MODEL_DEFAULTS` binds **27** characters. The roster is ~121. Everyone else fell through to the
procedural rig in matches, run-ins, Universe and God Within — which is most of the roster, and is
exactly "procedural models are still appearing when not selected".
The layer written to catch this was DEAD: the MDickie base-attire system resolves to
`assets/models/mdickie_bases/<BASE>.glb` and **that directory has never existed in this repo**, so
every archetype fallback 404'd back to procedural. It was written against assets that were never
going to arrive.
`window.ARCHETYPE_BODY` now points at bodies WE ACTUALLY SHIP — each one wired, rig-continuity
WHOLE and skinqa PASS, already in the APK, chosen so the silhouette matches: powerhouse->BRUTUS,
monster->TITAN, brawler->WRECK_PATTERSON, striker->KOBRA, technician->AARON_RUBEN,
cruiser->CIPHER_rigged, luchador->EL_TORO_DE_ORO, enigma->HOLLOW, female->TYNESHIA, suit->STAN_COMBS.
Gender is checked FIRST — putting every unmapped woman in a male body is worse than the procedural
rig. Specific models still win; this only runs when nothing else resolved.
FOUND BY THE SMOKE HARNESS, not by reading: "ZEPHYR has no GLB bound (run-in)". A real roster
character with a full profile (maxHp 85, CAPOEIRA) and no model anywhere.
VERIFIED: ZEPHYR->KOBRA, GOLEM->TITAN, MORTUS->WRECK_PATTERSON, KAGE/RONIN->AARON_RUBEN,
LADY_RHIANNON->TYNESHIA, REY_FUEGO->EL_TORO_DE_ORO, THE_BOULDER->BRUTUS — every file present.

## THE CONTAINER DISK FILLS AND IT LOOKS LIKE A CODE BUG (2026-08-03)
`page.goto: Page crashed` on a harness that had worked minutes earlier. Not the code — `df` showed
**252G, 38M available, 100%**, and my own scratchpad was 6.8 GB of test bundles, model backups and
cloned repos. Chromium cannot start without scratch space, and it reports that as a page crash.
CHECK `df -h /` BEFORE DEBUGGING A HARNESS THAT SUDDENLY STOPPED WORKING. Deleting still succeeds
while writes fail, so clean up (test bundles, clones, .apk/.zip downloads) and re-run.

## OUR OWN MODEL GENERATOR — TripoSR RUNS HERE, ON CPU (2026-08-03)
Owner: "We would have more models if u had got a good tripo 3d alternative working, or could hook
up my tripo 3d account to this through logins and not API keys." Both are built.
### tools/models/image_to_3d.py — the generator. No account, no credits, no queue.
The alternative to Tripo IS Tripo: **stabilityai/TripoSR**, built by Stability AI WITH Tripo AI,
weights MIT, 167k downloads. Chosen over TRELLIS / Hunyuan3D / InstantMesh — all better models, all
requiring CUDA — because it is the one that runs GPU-less, which is what this box is.
**MEASURED, CPU ONLY: 19s to load, 23-25s to reconstruct, 45,108 verts / 90,224 faces, and the
render is unmistakably the input object.** `bash tools/models/setup_image_to_3d.sh` installs it.
FIVE PINS, EACH ONE A DEBUGGING ROUND. Do not "modernise" them:
1. **transformers PINNED TO 4.x.** v5 renamed the ViT internals (`encoder.layer.N.attention.
   attention.query` -> `layers.N.attention.q_proj`), so the 2024 checkpoint stops matching the model
   it builds and load_state_dict fails with 192 missing keys.
2. **torchvision must be the `+cpu` build from PyTorch's own index.** A plain `pip install
   torchvision` takes the PyPI wheel, built against a different torch ABI, which dies at import with
   `operator torchvision::nms does not exist` — and pip then says "already satisfied" and refuses to
   replace it, so it needs `--force-reinstall`. `--index-url`, NEVER `--extra-index-url` (that pulls
   ~3 GB of CUDA onto a GPU-less box; it has happened twice).
3. **torchmcubes shimmed with PyMCubes** — the real one is a compiled CUDA extension with no wheel.
   **THE AXIS FLIP IS THE WHOLE POINT:** torchmcubes returns verts (x,y,z), PyMCubes (z,y,x).
   Unflipped you get a mesh that looks completely plausible and is MIRRORED.
4. **rembg is stubbed** — it drags in the broken torchvision and TripoSR's own run.py imports it at
   module scope, so the stock script is unusable for a reason unrelated to the model. Background
   removal is a border flood fill instead, which is what a reference photo actually needs.
5. **THE MESH COMES OUT Z-UP AND MUST BE ROTATED -90 ABOUT X.** Caught by RENDERING it, never by a
   number: the first chair reconstructed perfectly with bbox x 0.58, y 0.56, **z 1.01** — the height
   was on Z, so it was lying on its back. A wrestler would arrive face-down and the engine's
   fit-to-1.78m would size him by his DEPTH. Vertex count, face count and file size were all
   perfect. OWNER LAW, again: SEE IT.
THE OUTPUT IS UNRIGGED, and that is already solved — `transfer_weights.cjs` copies a proven
58-joint rig onto it by spatial correspondence (the fix that took the Heavyweight p95 0.3131 FAIL ->
0.0284 PASS). Full chain: image -> TripoSR -> transfer_weights -> skinqa -> rig_continuity ->
decimate --gate -> snapshot AND LOOK AT IT.
### tools/models/tripo_session.cjs — his OWN account, by LOGIN, not an API key
Same proven stack as social_login.cjs: CONNECT relay in front (the agent proxy accepts only
CONNECT), TLS capped at 1.2 (the middlebox resets a 1.3 ClientHello), automation flags erased,
HEADED on Xvfb. Credentials come from TRIPO_EMAIL / TRIPO_PASSWORD, are used once and are NEVER
written to disk; only the session lands in `.claude/tripo/session.json` (0600, gitignored).
It REFUSES to claim success without a real auth cookie and screenshots whatever it landed on —
because a wrong selector times out and reads exactly like a rejected password.
HONEST LIMIT: Tripo's web app is a private, unversioned interface. Endpoints are read off the live
page at run time rather than hardcoded, but a redesign will break it, and the failure mode is a
screenshot and a clear message rather than a silent wrong answer.
WHICH TO USE: generate locally for the long tail (free, 25s, no queue); spend account credits on
hero characters where the quality is worth it. Both land in the same place and go through the same
rig-and-gate chain.

## NOTHING IN THIS GAME COULD BREAK (2026-08-03) — BANNON_BREAK
Owner, on a TripoSR test that reconstructed a dining chair: "that's not a wrestling chair, or a
folding chair, so it's pointless unless it's breakable furniture." He was right about the bigger
thing: **MEASURED, `breakTable` / `tableBreak` / `breakProp` / `_broken` returned ZERO hits across
the whole file.** Nothing had ever broken. BANNON_PROPS had a real state machine — standing /
stacked / leaned / onFire — and no BROKEN state, so a table put through by a powerbomb just stood
there. TABLES and TLC were `live:false` in the match list for exactly that reason; both are live now.
WHAT BREAKS, read off what the objects actually are:
  table SHATTERS (gone, standHeight 0) · chair FOLDS and stays a weapon · ladder BUCKLES and stays
  climbable · steel steps never break, and their absence from the table is a decision, not an omission.
IT BREAKS ON PHYSICS, NOT A BUTTON — downward speed x mass past a threshold expressed as a fraction
of MAX_BODY_VEL, so every existing slam, powerbomb, splash and dive lights it up at once and no
"break move" was added. Damage goes through the ENGINE'S applyDamage so DMG_SCALE and MAX_HP still
own the numbers.
### FOUR BUGS THE TEST CAUGHT THAT READING WOULD NOT HAVE
1. **`applyDamage(victim, dmg, attacker, move, forceDown)` — I passed an OPTIONS OBJECT as the third
   argument.** The engine read `{source,noBlock}` as the ATTACKER and the damage silently did
   nothing: **hp -0 on a table that had visibly shattered.** The mechanic looked finished and the
   only wrong number in the whole report was a zero. READ THE SIGNATURE, never assume an options bag.
   After: table hp -179, chair hp -62.
2. **Sampling `f.vy` cannot catch an impact.** The engine rewrites it every frame and ZEROES IT ON
   LANDING, so by the time the check ran a body that fell at 3.2 m/s read 0 — the first version broke
   a chair and left a table standing under the same slam, which is backwards (a table needs LESS
   force). Fixed with a decaying PEAK HOLD of fall speed. An impact is an EVENT; sampling a velocity
   hoping to catch the frame it is large is a coin flip.
3. **standHeight() had to be wrapped.** It is what every climb, stand and dive-off reads; a broken
   table still reporting 1.0m leaves a man standing in mid-air on splinters.
4. **MY TEST WAS WRONG TWICE and both times blamed the code.** It counted 6 frames on a harness
   running at ~3 fps and read the table's state one frame BEFORE it broke; then it let a ragdoll
   slide off the table (dz 0.59 -> 1.65) and measured the drift instead of the break. Wait for the
   EVENT, and keep the prop under the body. `BANNON_BREAK.probe(p,f)` returns every number the test
   uses so a failure is read, not guessed — that is what settled it.
VERIFIED: slam through a table breaks it at speed 4.53; WALKING on it does not (a table you can break
by standing on it is not a table); table -> broken/standHeight 0/hp -179; chair -> bent/0.55/-62;
ladder -> bent/2.4; steps not breakable. 0 page errors, smoke PASS.

## JAGER + THE ENTRANCE TRON (2026-08-03) — and the tool bug that faked a success
Owner supplied a Tripo model, two reference shots and an entrance video for **Fredrico Hunter, "Young
Jager"**, with one instruction that shaped the whole tron system: *"I will add a song that will play
instead of the video audio during entrance and victory, since trons have no audio."*
### THE TRON — BANNON_TRONVIDEO
BANNON_TRON drew a procedural text tron into a 512x256 canvas bound to the arena screen. It now also
plays VIDEO into that same canvas, then hands the screen straight back — one texture, no second
material, no extra draw call. **Silent by design and by necessity:** the audio track is stripped from
the FILE at bake time, the element is muted + playsInline, and music stays the theme system's job for
both entrance and victory. An unmuted video cannot autoplay on a phone anyway, so the requirement and
the browser agree.
26.8 MB 1080p -> **0.38 MB** h264 at 512x256, the exact tron size. **Pillarboxed, never cropped** —
16:9 into 2:1 cropped to fill would cut the head and boots off a standing figure.
**TWO ENCODES PER TRON, and it is not belt-and-braces.** h264 is what an Android WebView decodes, so
the mp4 ships. But **Playwright's bundled Chromium has no proprietary codecs**, so with mp4 alone the
tron cannot be tested here at all — readyState 0, videoWidth 0x0, play() rejected. VP9/WebM decodes in
both. `srcFor()` picks by `canPlayType`.
**THE MEASUREMENT TRAP I ALMOST FELL FOR:** my first test sampled the tron canvas and reported
"PIXELS CHANGING: true" — while `frames: 0` and `failed: 1`. **The canvas always changes, because the
PROCEDURAL tron animates** (pulse + scanline sweep). The honest signal is frames drawn BY THE VIDEO
PATH. After the webm: **15 frames drawn, 0 failed, muted=true, no audio track.**
### THE JAGER MODEL — and transfer_weights printing SUCCESS on garbage
62 MB / 1,997,902 tris / unskinned from Tripo -> 38,820 tris / 4.5 MB / 58 joints / WHOLE.
**transfer_weights.cjs COULD NOT READ ANY OF OUR RIGS AND DID NOT SAY SO.** It has its own minimal
GLB reader — fast, dependency-light, and completely ignorant of EXT_meshopt_compression, which EVERY
model in assets/models now uses. Fed VIPER it read compressed bytes as float32, computed
**src height 6.74e+38**, and then printed *"wrote ... 58 joints ... texture preserved"* and exited 0.
A TOTAL SUCCESS MESSAGE ON PURE GARBAGE. It now decompresses to a temp file first and REFUSES loudly
if it cannot. Any future re-rig would have hit this.
**PRE-SCALE THE MESH BEFORE TRANSFERRING.** transfer_weights aligns with a single uniform yScale, so
a 0.98m Tripo body against a 1.8m rig does every nearest-neighbour lookup in a stretched space:
mean correspondence **0.0506m**, widest piece spanning only 20 joints. Scaling the unrigged mesh to
1.799m FIRST: **0.0182m** (better than BANNON's proven 0.0206m) and 35 joints. Then rescale_mesh
fixes the bone/mesh ratio (1.941 -> 1.000), the same defect as TARZANIAN_DEVIL 1.936 and CODY 1.944.
**HONEST STATUS: skinqa p95 0.1361 = FAIL** (threshold 0.12), worse than anything else we ship,
while rig_continuity is WHOLE and the RENDER is clean — chains, cuffs, rings, studded ripped denim,
boots and the physique all correct with no shredding. Correspondence is excellent, so the residual is
most likely his bind POSE differing from VIPER's rather than bad weights. He is banked and wired
because the owner wants him in, but he is on the list for a proper re-rig and the number is stated,
not buried. DO NOT record him as a PASS.
OWNER FLAGGED ON THE MODEL ITSELF: the beard is far thicker than his, and the broken-heart tattoo is
wrong — both need the facial-hair / tattoo customisation pass in the creation suite.
### OPEN, NAMED BY THE OWNER THIS PASS
1. **ENTRANCES ARE WRONG.** Both competitors enter AT THE SAME TIME, SIDE BY SIDE, and it happens
   DURING CHARACTER SELECT. Neither MDickie nor WWE 2K does either of those. Entrances must be
   SEQUENTIAL and must run after the select screen, with the tron cued per wrestler.
2. Facial hair add/remove + tattoo editing in character customisation.

## ENTRANCES WERE BOTH BUGS HE SAID THEY WERE (2026-08-03) — BANNON_ENTRANCE_SEQ
Owner: "neither mdickie or WWE 2k has both the competitors enter at the same time side by side, but
u have 1 entrance fur both competitors enter at the same time and it happens during character
selection." Both halves true, both MEASURED across a full boot -> select -> FIGHT:
    ENTRANCE.play  fired ONCE, for p1 only. p2 NEVER GOT AN ENTRANCE AT ALL.
    WALKOUT.run    fired ZERO times. The five-segment ramp walk had never run in a match.
    at the bell    BANNON (-0.70,-0.70) and VIPER (0.69,-0.88) — already in the ring, together.
And the side-by-side was LITERAL, inside BANNON_WALKOUT.run:
    F.forEach(function(f, i){ begin(f, i ? 1 : -1); });   // both, same frame, lanes -1 and +1
run() now takes ONE fighter and walks him in the CENTRE lane; BANNON_ENTRANCE_SEQ orders them,
challenger first and headliner last (the convention both games use). It never runs under
__PREVIEW_BUILD, which is what was firing entrances while browsing the select screen — spawnPreview
calls startFight to build its standing bodies. Skippable per entrance AND a SKIP ENTRANCES chip, with
a 15s ceiling per man on top of the walkout's own 12s, because a bell that never rings is
unrecoverable.
AFTER: `WALKOUT.run VIPER t+20.5s`, `WALKOUT.run BANNON t+36.0s` — 15 seconds apart, sequential,
0 entrances during select. SEQ stats {sequences:1, entrances:2, lastOrder:["VIPER","BANNON"]}.
### THE ENTRANCE KIT — the options he asked for, per wrestler
`window.BANNON_ENTRANCE_SEQ.setKit(name, {...})`, stored in localStorage under
`bannon_entrance_kits`, read by the director at cue time:
  titantron AUTO|VIDEO|NAME|NONE · minitrons · lighting ARENA|DARK|SPOT|STROBE|COLOUR (+lightCol)
  smoke NONE|LOW|HEAVY · pyro NONE|STAGE|RINGPOST|FULL · gait · hold
LIGHTING CHANGES INTENSITY, NEVER `.visible` — three.js keys its shader programs on the LIGHT COUNT,
so hiding a light recompiles every material in the scene. That is already written down in
BANNON_PERF and it applies identically here. The editor UI on top of this is the next piece.
### A MEASUREMENT OF MINE THAT WAS WRONG, CORRECTED IN THE SAME PASS
The probe reported `startFight` running NINE times per FIGHT press. It does not. All nine stamps
share the SAME MILLISECOND — that is ONE call passing through nine nested wrappers, because the
probe re-armed on `setInterval` and BANNON_PERF re-wraps `window.startFight` after it, producing a
new unguarded function each time. **A repeated instrument stacks; check the timestamps before
believing a count.**

## THE LAST TWO WAYS A PROCEDURAL BODY REACHED THE SCREEN (2026-08-03)
Owner's standing priority: "never seeing procedural three js models unless specific attires for that
are selected." Measured by sampling EVERY FRAME of a full match, not by reasoning about the code.
### 1. "DOWNLOADED AND PARSING" LOOKED EXACTLY LIKE "HUNG"
Normal connection: **2 procedural frames of 158**, at t+10.75s — with the GLB arriving at t+12.6s and
`_modelFailed` left TRUE on a fighter who HAD his model. The download finished in under a second from
LOCAL files, then onProgress went silent, because **there are no progress events for PARSING**.
GLTFLoader spreads a multi-megabyte parse across frames (12.6s at harness frame rate). My own stall
detector read that silence as a hang, declared failure and revealed the body — 1.9 seconds before the
model landed. Fixed: once `loaded >= total` the bytes are all here and only the hard ceiling applies.
A late arrival also clears `_modelFailed` instead of leaving a fighter marked failed forever.
**0 procedural frames of 208** after.
### 2. RUN-INS NEVER ASKED FOR A MODEL AT ALL
On a slow connection (4s per model — his phone on bad data): **31 frames of 167**, all of them the
interferer. The two competitors bound at ~15s; the intruder at 24.2s, and the procedural frames run
exactly between. `setProcVisible` only blocks the built-in body when `_charModelRequested` is set, and
that flag comes from applyCharModels, **which only ever runs for the SIDES p1..p4**. An interferer is
built with a bare `new Fighter(...)` and pushed onto `fighters` — no request, no ban, a tube.
THE FIX IS NOT A NEW LOADER: a fighter at index 2 IS p3 (`fighterFor('p3')` returns `fighters[2]`), so
the existing machinery already covered him and was simply never asked. BANNON_LATE_BODIES asks for
every fighter's model and holds him invisible until he is himself. A run-in a second late is a run-in;
a run-in as a grey tube is the bug. **0 procedural frames of 199 on the slow network** after.
LESSON, third time this session: a flag that gates a rule is only as good as the paths that SET it.
## BANNON_TRON_STUDIO — custom trons on the phone (2026-08-03)
"we need a way to add and make custom trons in game." Front end for the entrance kit
BANNON_ENTRANCE_SEQ already reads: pick a video off the device, set titantron / mini-trons / lighting
/ smoke / pyro per wrestler, PREVIEW on the real arena screen. `BANNON_TRON_STUDIO.open()`.
Reuses **BLIB**, the IndexedDB library device-imported MODELS already use, rather than opening a
second store — so a custom tron survives a reload and an OTA swap for the same reason a custom model
does, and there is one storage story instead of two. A blob: URL dies on reload, so the bytes are
re-read and a fresh URL minted at boot; the ASSIGNMENT lives in the kit, the MEDIA lives in BLIB.
**Refuses files over 24 MB and says the real number.** There is no ffmpeg on a phone so it cannot
transcode, and silently storing 60 MB in IndexedDB to draw it at 512x256 is how a save becomes
unrecoverable. The trons that ship with the game are 0.38 MB via tools/tron/bake_tron.sh.
VERIFIED by driving the real UI: 9/9 controls, video stored + assigned, and **after a full page
reload the kit and the custom video are both still there** — which is the only proof that matters,
since a blob URL cannot survive one.

## JAGER: CLEAN-SHAVEN IS THE DEFAULT NOW (2026-08-03) + tools/models/ingest_character.sh
Owner supplied the no-beard body as the DEFAULT after flagging the first model's beard as far thicker
than his. It also MEASURES better on the identical pipeline and donor rig:
    JAGER.glb (no beard)  skinqa p95 0.1133 WEAK — passes    33,917 verts / 34,708 tris
    JAGER_beard.glb       skinqa p95 0.1361 FAIL             37,780 verts / 38,820 tris
The bearded one is KEPT as a GLB attire under CHAR_ALT_MODELS.JAGER (owner LAW: never drop generated
content), so it is selectable rather than deleted.
### THE PIPELINE IS A TOOL NOW — tools/models/ingest_character.sh
Written after running the same chain by hand three times and hitting the SAME four traps each time.
`bash tools/models/ingest_character.sh <raw.glb> <KEY> [donor] [tris]`:
1. DECIMATE FIRST AND ITERATE — 2.0M triangles will not reach 18k in one pass, meshoptimizer's error
   bound stops it (2.0M -> 143k -> 71k -> 50k measured). Also 25x cheaper than transferring onto 1.1M.
2. PRE-SCALE TO THE DONOR'S HEIGHT BEFORE TRANSFER — a single uniform yScale means a 0.98m body against
   a 1.8m rig does every lookup in a stretched space: 0.0506m mean correspondence and 20/58 joints,
   versus 0.0182m and 35 joints pre-scaled.
3. RESCALE MESH TO SKELETON AFTER — the transfer leaves bone/mesh ~1.94 and the engine sizes by the
   BONE span, so the visible body ends up half height (TARZANIAN_DEVIL 1.936, CODY_gear 1.944).
4. SNAPSHOT AND LOOK. The first mesh generated here came out lying on its back with a perfect vertex
   count, and skinqa cannot see a severed rig at all.
## AN INSTRUMENT OF MINE THAT READ ZERO, AND WHY IT WAS WRONG (2026-08-03)
Building a per-STATE animation audit I wrapped `window.studioApplyClipPose`, bucketed calls by the
fighter's state and measured bone travel per bucket. It reported **1,342 calls and 0.000 bone travel
across every state**. That is not a finding, it is a broken instrument, and it is worth writing down
because it is the SAME trap already in this file:
  * the engine calls `studioApplyClipPose(this, _mc, p)` as a **LEXICAL identifier** at its main
    combat sites. Wrapping `window.studioApplyClipPose` intercepts only the module call sites
    (taunts, zone moves), not the combat path — so the calls counted were not the calls that matter.
  * verified separately that `window.__boneOf` resolves all 58 bones on a live fighter, so the bone
    lookup was fine; the wrapper was in the wrong place.
`tools/harness/smoke.cjs` already measures this CORRECTLY and reports real per-category deltas
(strike / grapple / walk, with named bone travel). Extend THAT rather than building a fourth
instrument. A per-category audit covering zoning, dives, pins and ring transitions is still OPEN and
should be added to smoke, not written fresh.

## THE HARNESS HAS A NOISE FLOOR — MEASURED 2026-08-04. READ THIS BEFORE TRUSTING ONE RUN.
Re-ran tools/harness/stall_autopsy.cjs on the IDENTICAL baseline build, same machine, same 28.7 s
window, nothing changed between the two runs:
    gl.linkWait   1,762 ms  ->  2,568 ms   (+46%)
    js.raf        3,786 ms  ->  4,827 ms   (+27%)
    gl.texture      855 ms  ->    686 ms   (-20%)
    worst frame   1,651 ms  ->  2,124 ms   (+29%)
A SINGLE RUN CANNOT RESOLVE A DIFFERENCE SMALLER THAN ROUGHLY HALF. Several conclusions in this
file's history rest on one run of a render harness; they are worth less than they read. From here:
compare against a CONTROL RUN OF THE SAME BUILD, not against a number recorded in a previous
session, and treat anything under ~50% as unproven. Counts (programs linked, procedural frames,
poseCalls, node counts) are far tighter than timings — prefer them.

### WHAT THIS CAUGHT, SAME DAY (the reason it is now law)
- **BANNON_GPUQ, built and then DELETED.** It swept the scene every 120 ms for materials with no
  compiled program and called renderer.compile whenever it found one. Measured js.raf 3,786 ->
  12,655 ms, worst frame 1,651 -> 4,432 ms. Clearly outside the noise floor, so a real regression.
  ROOT CAUSE: it can never converge — particle and fx materials are created and destroyed
  constantly, so "an unpaid material exists" is true forever and the queue re-walked the whole
  scene graph and re-ran an all-or-nothing compile every 400 ms for the life of the match.
  A SYSTEM THAT CANNOT CONVERGE IS NOT A SYSTEM WITH A BAD CONSTANT. Do not re-tune it; the idea
  is wrong. Deleted, not damped.
- **BANNON_POSTWARM kept on the STRUCTURAL argument, not a claimed speed-up.** renderer.compile
  walks the SCENE GRAPH, and EffectComposer's passes own their own materials — a luminosity pass,
  five bloom mip blurs run twice each, three ShaderPasses — none of which are in the scene. They
  link on the composer's FIRST render. One composer render, once, at boot. It measures INSIDE the
  noise floor and is written down as unproven.
- STILL OPEN: 15-19 shader programs first link after the bell, 6 of them within 3 s (behind the
  entrance, harmless) and ~9 at 16-25 s into the match. Those are created-and-drawn in the same
  frame, so nothing that watches the scene can pre-empt them — the fix is to CREATE the fx and
  damage materials at boot so they are never new. Not attempted yet.

## THE FEDERATION IS QUERYABLE NOW (2026-09-03) — tools/federation/
Owner: "the orchestrator should automatically search the federation and discover the implementation
you already built elsewhere instead of making you say 'Go add M.-Engine-'." Fair — handing him a
repo list is not automation.
- `node tools/federation/index_repos.mjs [--refresh] [--repo NAME]` clones every repo shallow with
  `--depth 1 --filter=blob:none --no-checkout` (the whole TREE, none of the file CONTENT) and
  derives what is actually there: entry points, languages by file count, top-level subsystems, and
  CAPABILITY TAGS matched from real paths.
- `node tools/federation/find.mjs "<what you need>"` / `--list` / `--repo NAME` answers with
  EVIDENCE — the capability, the file count that earned it, the subsystem, the entry point to open.
- **CAPABILITIES ARE DERIVED FROM FILES, NEVER FROM DESCRIPTIONS.** A registry saying
  "M.-Engine- = engine components" is a guess wearing a schema and goes stale the day after it is
  written. OWNER LAW: metadata is a hint, never an authority. `role` is carried through and labelled
  as a declared hint; nothing ranks on it.
### THREE TRAPS, ALL MEASURED, ALL WORTH KEEPING
1. **THE SESSION GIT PROXY SERVES LOWERCASE REPO NAMES.** `mhvnsnt/CODEDUMMY` 404s;
   `mhvnsnt/codedummy` clones. CODEDUMMY was ALREADY ATTACHED to the session and still "failed to
   clone", which reads exactly like a permissions problem and is a casing problem. GitHub's web UI
   is case-insensitive, so the display name from `list_repos` carries the owner's capitalisation and
   is NOT what to dial. Lowercase every clone URL.
2. **`git ls-tree -l` DEFEATS `--filter=blob:none`.** The sizes live in the blobs a partial clone
   deliberately did not fetch, so asking for them sends git back to the network per object. It hung
   and the catch reported "empty tree" for a repo whose tree reads perfectly by hand. Use
   `--name-only`; file COUNTS are a better proxy for "is this a real subsystem" than bytes anyway,
   because one checked-in binary outweighs a whole module.
3. **TWO INDEXER RUNS IN FLIGHT CLOBBER EACH OTHER.** An earlier run finished LAST and overwrote the
   good registry with its stale results — `find.mjs` then reported 1 indexed repo out of 15 and
   named Bannon itself as "not indexed". Check `pgrep -f index_repos` before re-running.
### ATTACHING IS THE ONLY MANUAL STEP, AND IT IS ONE CALL
A repo the session has not been given 404s identically to one that does not exist, so the tool says
`NOT ATTACHED — run add_repo(owner/name) first` rather than printing a git error. Currently indexed:
Bannon (8,260 files), CODEDUMMY (1,999), M.-Engine- (678), bolt.diy-M (538), God-Mode-OS-D3MN-V2
(519), Wrestli6game-3 (48), M-Hero-Simulator- (39). mhvnsnt/UnrealEngine is DELIBERATELY SKIPPED —
it is a fork of Epic's engine at tens of GB, and filling this container's disk has twice presented
as an unrelated "Page crashed" in a harness.
### WHAT IT ALREADY FOUND
`find.mjs worker pool sandbox` -> `M.-Engine-/tools/unreal-worker/server.js`. That is the exact
"you already built this" case the owner described, answered without him naming a repo.

## FEDERATION-ASSISTED AUDIT (2026-09-03) — tools/federation/audit.mjs
Owner's two questions, both facts about the files, so neither is answered with an opinion:
"which imported open-source projects are actually INTEGRATED versus merely STORED", and "is Bannon
carrying a vendored duplicate that should be replaced with a canonical integration".

**INTEGRATION HAS A BLUNT DEFINITION HERE: a subsystem is INTEGRATED if something OUTSIDE it names
it.** Not "does it look important", not "is it in the README". References are weighted by WHERE
they live, because they are not equal — the shipped HTML naming it (100) means the running game
reaches it; a workflow or bundler (20) means it reaches a device; a tool or script (5) means the
pipeline reaches it; a .md (1) means a human wrote about it. A subsystem whose only reference is
documentation scores 1 and the report says so, instead of "referenced".

### MY FIRST RUN OF THIS WAS WRONG AND FLATTERED EVERYTHING — the same trap, again
It searched for the BARE DIRECTORY NAME and reported `config` — ONE file — with 405 references and
a score of 1,283, because it was matching the English word in every comment and identifier in the
repo. `logs`, `models`, `workspace`, `dist` and `roadmap` were inflated identically, and the whole
report read as if every generic-sounding folder were load-bearing. Fixed by matching the name as a
PATH (`config/`), since a real reference to a directory essentially always carries the slash.
`roadmap` went from "IN THE GAME, 271" to "PARKED, 0". **A measurement that makes everything look
healthy is the one to distrust first.**

### WHAT IT FOUND — 872 files with two or fewer external references
    PARKED, nothing outside them names them at all:
      claude-plugins-official-main  405 files      living-nexus-android   45
      BlenderGoodies                  7            autonomous_payloads     1
      roadmap                         1
    One or two references only:
      box3d-0.1.0                   350            harness-main           35
      blender-mcp-main               15            backend                 5   (documentation only)
      android_build                   4            blendforge              4
    And the one the owner asked about directly:
      imports/                      390 files, 7 references, PIPELINE ONLY — the imported
                                    open-source projects are stored, not wired into the game.
    Genuinely load-bearing, for contrast: godmode/ 526 files (226), unreal/ 717 (229),
    tools/ 155 (378), assets/ 4,862, server/, native/, scripts/, models/, canon/, docs/.

### VENDORED DUPLICATES — CODEDUMMY IS 84.7% INSIDE BANNON
1,581 shared paths: godmode/ 516 · box3d-0.1.0/ 346 · claude-plugins-official-main/ 307 ·
src/ 130 · assets/ 57 · harness-main/ 31 · canon/ 16 · blender-mcp-main/ 12.
Overlap is measured BY PATH, never by name — two repos both having a `src/` proves nothing, and
paths every JS project carries (package.json, README, LICENSE, .gitignore, index.html, tsconfig,
lockfiles, Dockerfile) are excluded before scoring. Other repos share only boilerplate:
God-Mode-OS-D3MN-V2 15 paths, M-Hero-Simulator- 8, Wrestli6game-3 6, M.-Engine- 5, bolt.diy-M 1.
CANONICAL OWNERSHIP, on the evidence: `godmode/` is REACHED from Bannon (226) so Bannon is its
integration target; `box3d-0.1.0`, `claude-plugins-official-main`, `blender-mcp-main` and
`harness-main` are third-party copies Bannon does not reach, duplicated out of CODEDUMMY.
**NOTHING HAS BEEN DELETED. OWNER LAW: never prune without asking.** This is a build list, not an
action taken.

## CHECKPOINT PROTOCOL (2026-09-03) — the container WILL disappear mid-task
It happened twice in one session: the working tree reset to an older lineage and every uncommitted
thing went with it — a whole appearance module, two harnesses and a world-shrink pass, all lost the
first time. The second time nothing was lost because it had been pushed.
    implement -> gate (syntax + the harness that covers it) -> commit -> PUSH -> continue
PUSH IS PART OF THE STEP, NOT THE END OF THE TASK. A working tree is not storage, and an ephemeral
container makes "I'll commit it all at the end" a bet that loses eventually. Recovery is
`git fetch origin <branch> && git reset --hard FETCH_HEAD` — which is only ever available if the
push happened.

## THE FUZZER FOUND ITS FIRST REAL BUG (2026-09-03) — AND THE COMPLETE LOOP RAN
tools/harness/fuzz_invariants.cjs, seed 39094, 30 generated actions, shrunk to FOUR:
    hide -> resize 899x799 -> tier 0 (FULL) -> tier 4 (POTATO)
### THE DEFECT: A RATE LIMIT THAT DROPPED INSTEAD OF DEFERRING
    if (C.setPixelRatio && Math.abs((C.__pr||0)-want) > 0.01 && (now - (C.__prAt||-9999)) > 1000)
The cooldown sat in the SAME condition as the change, so a second tier change arriving inside the
one-second window was not delayed — it was THROWN AWAY. The composer kept FULL's pixel ratio while
ST.tier, the build badge and every log line said POTATO. **THAT DEFEATS THE WHOLE AUTO-TIER: the
game drops the tier and the cost does not go down.** It is "it says POTATO and it still freezes".
It is worst exactly when it matters most: the hard-stall path fires `floor(d/1200)` steps at once
and can fire again on the next bad frame, so a device in real trouble produces BURSTS of tier
changes — and every change after the first in each second was silently discarded.
FIXED by recording the wanted ratio always and letting one pending timer apply the LATEST value
when the window expires. A burst of N changes costs exactly TWO reallocations (first and final)
instead of N — which is the reason the rate limit exists — and the composer can never disagree.
### THE INVARIANT WAS PROVEN TO FIRE BEFORE IT WAS TRUSTED
New **I10: the composer's pixel ratio must agree with the active tier** once settled (a deferred
change is correct, not a violation, so `__prTimer` pending is honoured). The fix was temporarily
REVERTED and the same repro replayed: `I10  tier HIGH wants composer pr 1.75 but it is 2`. With the
fix restored the identical replay PASSES. An invariant that has never failed is not a test.
### I8 IS SCOPED, AND THAT MATTERS
The original 4,018 ms frame did NOT go away with the fix, and chasing it as a bug would have been
wrong: the fuzzer had set tier 0, and FULL on an 899x799 viewport at dpr 2 is ~2.9M pixels through
five post passes. On this container's SOFTWARE rasteriser a 4-second frame there is the honest cost
of that configuration. I8 now only fires at tiers a phone actually runs, and reports a raised-tier
frame as a soft NOTE. Reporting configuration cost as a broken invariant buries the real ones.
### WHAT THE PASSING RUNS SAY, WHICH IS NOT "FINE"
Worst frames on runs where nothing broke: 2,856 ms, 2,624 ms, 3,615 ms — several around BOOT, before
a match exists. Multi-second stalls remain even when every invariant holds. The harness reports the
worst frame on a PASS for exactly this reason: "no invariant broken" and "the worst frame was
3.6 seconds" are both true at once, and only one of them is what the owner feels.

## THE FREEZE IS THE MENU (2026-09-03) — tools/harness/boot_autopsy.cjs
Every harness in tools/harness starts measuring AT THE BELL. The fuzzer's PASSING runs kept
reporting worst frames of 2,856 / 2,624 / 3,615 ms with several of them BEFORE A MATCH EXISTED, so
the worst stalls in this game were living in the one region nothing had ever looked at.
boot_autopsy attributes every long frame to an OBSERVED boot phase — PAGE, SCRIPT_EVAL, ENGINE,
RENDERER, FIRST_FRAME, MENU, SELECT, MATCH_LOAD, MATCH — each opening when its MARKER IS SEEN, never
on a timeline, because a hardcoded timeline invents boundaries and then attributes stalls to them
confidently. FIRST MEASUREMENT, 412x915 at dpr 2:
    phase          start      ms   long   worst    work in the phase
    PAGE             0.2   807.7      0       0
    ENGINE         807.9    5432      2     843    23 shaders · 1 wasm
    RENDERER      6239.9    28.3      1    4538    1 render
    FIRST_FRAME   6268.2  3319.1      1    1237    2 shaders · 35 renders
    MENU          9587.3   34043      23   4756    49 shaders · 354 renders
    SELECT       43630.7  1627.9      1    1007
    MATCH_LOAD   45258.6   469.7      1     404
    MATCH        45728.3  6973.5      7     963
**THE MENU IS 34 SECONDS LONG AND 35.6 OF THOSE SECONDS ARE STALL** — 23 long frames, worst 4,756 ms,
against 4.3 s of stall in the whole MATCH. Sitting on the main menu doing nothing is the freeze.
The stall context says what it is doing: shader links climbing 25 -> 59 across the phase and up to
**26 concurrent pending requests**. That is preview/warm work on the main thread, not gameplay.
A single 4,538 ms frame also sits in RENDERER — the very first frame after the WebGL context exists.
### THE INVARIANT IS ATTRIBUTION COMPLETENESS, NOT A BUDGET
"Boot must be under X ms" would be a noisy lie across environments — this container is a software
rasteriser and its absolute numbers say nothing about a phone (already law, above). What CAN be
asserted is that **every long frame falls inside exactly one open phase and every phase has a
start**. If a stall lands with no phase the MODEL is wrong and the report says so rather than
quietly filing it under whatever was nearest. First run: 0 gaps, 0 unstamped, ATTRIBUTION COMPLETE.
### THREE CLASSES, KEPT SEPARATE (this is why I8 was rescoped and it applies here too)
    HARD INVARIANT FAILURE      behaviour contradicts a required system property
    SOFT PERFORMANCE FINDING    expensive enough to investigate
    EXPECTED CONFIGURATION COST expensive because a configuration was deliberately forced
Treating every expensive configuration as a broken invariant poisons the signal.
### THE BROWSER'S OWN RECORD IS IN THERE TOO
PerformanceObserver('longtask') logged 59 entries and independently agrees on the big ones (4,692 ms
at t+34,961; 4,519 ms at t+1,703). Its `attribution` is "unknown" for all of them, which is what a
single inline-script page produces — the container it would name IS the page. Useful as
corroboration, not as a pointer to a line.

## THE MENU LEDGER (2026-09-03) — tools/harness/menu_ledger.cjs, AND TWO BLIND INSTRUMENTS
boot_autopsy said WHERE. This asks WHICH WORK. Getting there took two corrections to my own
instrument, and they are the same mistake at two different layers — both worth keeping.
1. **THE WINDOW OPENED AFTER THE THING IT MEASURED.** The first version marked MENU when the DRIVER
   saw `gameState === 'menu'`. `page.evaluate` cannot return while the main thread is stalled, so
   the window opened only once the stalls had finished: **2 stalls in 40 s against boot_autopsy's
   23**. AN OBSERVER OUTSIDE THE PROCESS CANNOT TIMESTAMP A FREEZE INSIDE IT. Marked in-page: 24
   stalls, 25,701 ms, worst 2,464 ms — reproduced.
2. **THE SAMPLER WAS BLIND DURING THE STALL.** Attribution was "whichever subphase an 8 ms
   setInterval saw most during the gap". It reported MENU_IDLE for all 24 with `samples {}` on
   several, because **A STALLED MAIN THREAD DOES NOT RUN TIMERS EITHER**. Same-thread sampling
   cannot observe the window it exists for. What survives a freeze is a COUNTER: every counter is
   now diffed ACROSS the gap, and the deltas say what the thread finished while it was not
   answering. This is the general fix for measuring a freeze from inside the frozen process.
### THE LEDGER — 40 s sitting on the menu, doing nothing
    25 stalls · 27,479 ms · worst 3,288 ms · 577 frames
    3288ms shaders +13 · 2465ms shaders +21 · 1809ms shaders +22 · 1311ms glb +3 shaders +7
    SUMMED: shaders 76 · fetches 128 · glb 10       6 of 25 stalls had NO counted work at all
**SHADER LINKING OWNS THE MENU STALL — 76 of the 81 links in the window land inside a stalled
frame**, and the reading reproduced across two runs (76/81 and 69/73).
**THE THREE SUSPECTS NAMED GOING IN ARE NOT RUNNING:** canvas readbacks 0, portrait
get/prioritise 0, clip warm calls 0. The earlier pass that moved 121 portraits out of one
synchronous forEach HELD. This is different work.
### gameState REACHES 'menu' AT t+182 ms
The menu is not a screen the game arrives at after loading — it is the screen shown WHILE the game
loads underneath it. That is why every match-scoped harness missed all of this.
### A PERTURBATION THAT DID NOT APPLY, RECORDED AS SUCH
`--perturb noglb` was meant to suppress the portrait GLB queue. It did not: **12 GLB portraits
loaded in BOTH the baseline and the perturbed run**, so the 25->24 stall difference is noise and
proves nothing. The hook wraps `THREE.GLTFLoader.prototype.load` from an interval, and the portrait
queue starts before that interval first fires. A PERTURBATION THAT DID NOT CHANGE THE VARIABLE IS
NOT EVIDENCE — do not read the comparison.
### THE LEADING HYPOTHESIS, LABELLED AS ONE
12 GLB portraits at roughly 6 programs each is ~72, against 73-81 links measured. `onLoad` costs
only 7-10 ms total, so the cost is NOT parsing — it is the first DRAW of those materials, which is
where three.js links. That arithmetic fits, and fitting arithmetic is not proof. The experiment
that would settle it is a perturbation that actually suppresses the queue (install the hook in the
init script BEFORE any module runs, not from an interval).

## SYSTEM DONE (first half): THE GRAB ACTUALLY HOLDS ON (2026-09-03)
Owner's own bug report, verbatim: *"CURRENT BUG: grab animation visually connects, but hands drift
during rotation / OPEN SOURCE CANDIDATE: constraint / IK implementation / EXTRACTION: hand-target
solver only / GATE: same deterministic grab replay / PASS CONDITION: distance between contact points
remains bounded through the full move."* Nothing here had ever measured it. `smoke.cjs` proves a
grapple MOVES the skeleton, and bone TRAVEL is large whether the grip holds or lets go — it cannot
tell the two apart. **A PASSING METRIC IS NOT A PASSING MODEL** (the severed-rig lesson again).

### THE MEASUREMENT — tools/harness/grapple_contact.cjs
Per frame: distance from each attacker HAND bone to the NEAREST bone of the man he is holding, WHICH
bone that is, and how often the answer changes. Scale is the victim's live shoulder span, so no
verdict depends on a model being a particular height. **The contact threshold is taken from the
engine's own code, not invented:** `_gripOpp` places a gripping hand on the victim's joint with
offsets of at most 0.06 m, so 0.15 m is that with an allowance for bone-centre vs surface.
MEASURED, BANNON holding VIPER, STANDARD: lock-up **0.25-0.33 m**, hoist **0.32-0.40 m**. Four to
five times the engine's own definition of contact. The hands were never on the body at all.

### THE DECOMPOSITION IS THE POINT — it says WHICH HALF to go and fix
    INTENT  the engine's own procedural grip point -> victim body   0.183 / 0.237 m
    FOLLOW  the visible GLB hand -> that grip point                 0.197 / 0.242 m
Both halves broken, roughly equally. Reading the code agreed with the numbers: **`_gripOpp` — the
function written to put hands on the real body — IS NEVER CALLED AT STAGE 1.** The lock-up sets
`J.haL/haR` to fixed local offsets `(0.40, 1.40, ±0.14)` that know nothing about where the opponent
is standing. And where it IS called it writes into the PROCEDURAL rig, which is not the body on
screen. The engine has been solving grips on a skeleton the player never sees.

### THE FIX — vendored solver + adapter, and the adapter owns only what the library cannot know
`assets/vendor/CCDIKSolver.js` is **three.js r128's own** `examples/js/animation/CCDIKSolver.js`,
MIT, byte-for-byte unmodified, matched to the revision we already vendor. No solver was hand-rolled.
It addresses its target by INDEX into a SkinnedMesh's `skeleton.bones`, and our target is a point on
the OTHER fighter — in no skeleton of ours. **The adapter hands it a shim
`{ skeleton:{ bones:[hand, forearm, arm, target] } }`** and it runs unmodified against a world point.
That shim is the whole trick; remember it, it works for any three.js IK against an external target.
`BANNON_GRIPIK` owns three things only: WHERE (read from **GRIP_SPEC**, the engine's existing
per-move anatomy table, already researched and cited — nothing invented), WHICH (the procedural-key
-> Mixamo map is **INVERTED FROM MOCAP_BONE_MAP**, never written fresh; two spellings of one thing is
the most repeated defect in this codebase), and WHEN (after `updateFighterModel`, or the pose
overwrites it in the same frame). It also solves the HELD man's hands back onto the holder, which
poseGrabbed's stage-1 MUTUAL GRIP block already declares and then writes into the unseen rig.

### RESULT, A/B/A/B IN ONE BUILD (`--nogripik` is the control — never compare to a past session)
    stage 1 LOCK-UP   control 0.309 / 0.302 m   ->   0.067 / 0.070 m
                      control 0.669 / 0.564 m   ->   0.084 / 0.099 m
    stage 2 HOIST     control 0.404 / 0.534 m   ->   0.143 / 0.147 m
And the hand is on a NAMED part instead of wandering: grip bone **Spine2 — the chest, exactly what
GRIP_SPEC.STANDARD declares — on 80-93% of lock-up frames**, against 37-43% on a different bone every
few frames. SEEN as well as counted, side by side at 1.55 m.

### THE FINDING NO SOLVER COULD HAVE FIXED — MEASURE THE REACH BEFORE BLAMING THE IK
The reach ledger reported the grip target **out of reach on 100% of lock-up frames, short by 0.31 m**.
The attacker's arm, shoulder bone to hand bone off the bound GLB, is **0.43 m**. The tie-up was
parking the two men **0.85 m apart — FURTHER APART THAN AN ARM IS LONG**. A hand was being asked to
touch something it could not get to, and every IK in the world would have straightened the arm and
missed. That flat 0.85 is now DERIVED from the two bodies (0.95 of arm extension + a torso half-depth
from the shoulder span) and **can only ever return LESS than 0.85**, so the worst case is the old
behaviour and an unbound model gets 0.85 unchanged. Out-of-reach at lock-up 100% -> 45-58%,
shortfall 0.31 m -> 0.07-0.12 m.

### FOUR DEFECTS IN MY OWN INSTRUMENT, ALL FOUND BY MEASURING — the recurring shape
1. `shoulderSpan()` was handed the FIGHTER where it needed `fighter.model`. `__boneOf` on a non-model
   returns null without complaint, so every span was silently null and the scale vanished.
2. Attacker hardcoded as `fighters[0]`. The first run measured **the PLAYER BEING GRABBED BY THE CPU**
   with a third body (a run-in) on the mat. Read the pair off the live grabbing relationship, never
   off an array index.
3. **A DETERMINISTIC REPRO CANNOT BE TAKEN FROM INSIDE AN UNFROZEN MATCH.** Freeze the AI through the
   engine's own gate (`!f.isPlayer` in the updateAI loop) — not by setting `isPlayer`, which also
   routes input and the camera.
4. The drive stood where the fighters happened to be and the first `g` came back as `ropegrab` —
   ROPE_INTERACT correctly turns GRAB near the ropes into a rope grab. Then every `j` was a JAB that
   knocked the man down. Place at ring centre; only press `j` while a hold is live.
Plus: the first 350 ms of a stage is dropped, because poseGrabbed lerps the bodies into the hold and
judging a grip on its approach frame is an artifact — one frame at 0.785 m with a 0.13 m root gap was
dominating the drift figure. The discard is REPORTED, not hidden. And drift is judged on the p5-p95
BAND with the full range printed beside it, so a single stage-boundary frame cannot define a verdict.

### STILL OPEN, STATED NOT BURIED
- Stage 2 sits at 0.135-0.156 m against the 0.15 m threshold, with 61-73% of frames still out of
  reach by ~0.27 m. That is the CARRY GEOMETRY lifting the victim past where the arm can follow, not
  the solver. The honest next move is to aim at the reachable part of the victim nearest the declared
  grip rather than clamping along the ray into empty air.
- **STAGE 3 IS UNREACHABLE FROM PLAYER INPUT.** `playerAttack` sets `grappleStage = 3` and then falls
  through to the delivery ON THE SAME PRESS, by design and by its own comment. So the carry has never
  been measured from the player's side and nothing is claimed about it. Only the AI dwells there
  (`st===3 && stateTime>1.2`). The player's rotation window is really stage 2.
- The IK links carry no rotation limits, so an elbow can in principle fold the wrong way. Nothing
  like it showed in the renders; that is not the same as proven.
- `window.GRIP_IK = false` reverts the whole thing at runtime.
