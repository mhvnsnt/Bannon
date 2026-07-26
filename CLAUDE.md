
## Layered Override System Architecture
- C++ Runtime Loader added: BannonModLoader parses UserOverrides/ JSON patches post-boot.
- Async/GameThread Layered Injection for override states.
- RESTORE_CORE_VARIABLES failsafe implemented.

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
