# OWNER COMPLAINTS — THE STANDING LIST

**I should not have to be told these again, and neither should he.** This file is mined from the
owner's own messages across the whole project transcript (229 messages, 125 carrying a complaint
signal). It is the work queue. It is ordered by **how many times he has had to repeat himself**,
because a repeat is the strongest signal that something is still broken and I did not fix it.

Rules for this file:
- Only the owner's words define an entry. Not my interpretation of them.
- An entry closes ONLY with a measurement next to it. "Should be better now" is not a close.
- If he repeats something already marked closed, it reopens and the note says why the close was wrong.
- Never delete an entry. Struck-through history is how we stop going in circles.

---

## 1. THE GAME FREEZES MID-MATCH  ·  repeated 6+ times  ·  **FOUND AND FIXED (2026-08-02)**

> "the game keeps freezing mid match" · "the game still freezes mid match" · "now u have not fixed
> the freeze" · "the game still freezes mid combat" · "the game is still freezing as soon as I start
> fighting"

**(c) THE ACTUAL FREEZE. I had been looking in the wrong place for weeks.** "As soon as I start
fighting" was literal: it is the QUICK FIGHT press, and it is one function.

New tool `tools/harness/stall_autopsy.cjs` wraps every candidate blocker before any game code loads
and snapshots the totals once per frame, which splits a stalled frame into IN-JS vs OUTSIDE-JS.
Result:

```
t=14.72s menu_select dt=11937ms   JS 11703ms   OUTSIDE-JS 234ms
SINGLE CALLS OVER THRESHOLD:
   11689ms  EVENT click on BUTTON#btnFight.menu-btn  ->  function openSelect(){ … }
```

Not the GPU. Not the GLB parse (35 ms total). Not shader compile (2.7 s of it, inside the same
call). **A click handler that owns the main thread for 11.7 seconds.**

`tools/harness/profile_click.cjs` (V8 CPU profile of one button press) named the line:

```
11267ms  openSelect      BANNON_v150.html:38723
11168ms  renderRoster    BANNON_v150.html:38570
11122ms  get             BANNON_v150.html:42933      <- window.BANNON_PORTRAITS.get
 9095ms  toDataURL       (self)
```

`renderRoster` draws all **121** roster cards in one synchronous `forEach`, and every card called
`BANNON_PORTRAITS.get()`, which built a 3D bust, rendered it to a WebGL canvas and did a **blocking
GPU readback + PNG encode**. 121 readbacks back to back with nothing yielding between them. It also
queued a GLB portrait download for all 121 characters at once — **361 MB of roster models racing the
two bodies you are about to wrestle with**, which is the other half of "the model glbs are rendering
slowly".

FIXED: `get()` never renders now. It returns what it has (or null — the card already had a colour
gradient as its fallback) and parks the request. A pump does at most ONE portrait per animation
frame, and only for cards an `IntersectionObserver` says are on screen or that a P1/P2 plate asked
for. A character who has a GLB skips the bust entirely, because the GLB render is about to replace
it. Portraits still arrive through the same `bannonPortrait` event that was already there.

**MEASURED, same harness, before → after: worst stall 11,308 ms → 1,933 ms.** `openSelect`,
`renderRoster` and `click` no longer appear anywhere in the profile's top 20.

**Two different things were being confused, by me.**

**(a) FRAME RATE — cannot be settled from this container.** V8 profile puts 95% of time in
`(program)`, i.e. outside JS in the driver. Here that is a software rasterizer. Real costs removed
anyway, all measured: 742 non-fighter materials swapped off per-fragment PBR at LOW tier
(815 MeshStandardMaterial → 73); shadow filter dropped from PCFSoftShadowMap below HIGH; 12 of 16
lights were sitting at intensity 0 still costing full per-fragment work, now hidden once settled
(rendered lights 16 → 8); shaders pre-warmed once (114 ms) instead of compiling mid-match.
**Still unproven on his device.** Needs a 20-second screen recording from the phone, or an on-device
`BANNON_PERF.report()`.

**(b) THE HITCH — reproducible anywhere, and this one is real.** The clip bank is 269.7 MB across
973 files, median 103 KB, 50 over 1 MB. A move not yet thrown is fetched *at the moment it fires*
and `JSON.parse`d **on the main thread**. Network trace of a real match: 112 clip requests still
arriving 86 s after boot, individual clips taking 7–17 s. Parsing a megabyte blocks the frame.
- FIXED: `BANNON_CLIPWORKER` moves fetch+parse into a Worker. First pass got 76 clips / 6.9 MB
  off-thread with 218 fallbacks — because my wrapper used the RAW name while the real loader
  uppercases and underscores it (`STRONGZERO_SNAP`) and derives variants with no file at all.
  Speaking the loader's own naming: **271 clips / 70.6 MB now parse off the main thread** (10x the
  bytes), 122 fallbacks of which 85 are derived variants that correctly need no network.
- REJECTED, and correctly: I nearly stripped the ~92% of bone tracks our 28-joint rigs can't drive
  (269.7 MB → 69.3 MB). Owner: *"our rigs physically can have all those give them to them."* Those
  channels are finger curl and facial performance. **Do not strip them — upgrade the rigs.** (See #9.)

## 2. ANIMATIONS DEAD / BROKEN PUPPET / NO ARM SWAY  ·  repeated 6+ times  ·  MOSTLY FIXED

> "it plays visually like broken marionette puppet broken action figure and they float around
> instead of walk" · "none of the combat moves strikes or grapples look like..." · "there's no arm
> sway on locomotion or any movement above the waist" · "the animations seem dead"

Four independent root causes, all measured in the live game:
- **Clip bone tracks never resolved. 79,493 references, 0 hits.** Bones are filed lowercased with the
  colon stripped (`mixamorigleftarm`); clips write `mixamorig:LeftArm`; the lookup was verbatim.
  Every capture ever banked was discarded on one `if(!_b) continue;`. FIXED — one resolver.
- **`if (walking)` had never been true.** Histogrammed live while holding the walk key:
  `{"undefined/walk": 51}`. The whole walk branch — hip sway, spine wave, stride, foot placement,
  arm swing — had never executed. FIXED by deriving `walking` from state.
- **The walk pose was a boxing guard.** Hands pinned at chin height, 5 cm of sideways sway, nothing
  fore/aft. FIXED: hand swing 0.008 m → **0.608 m**, height 1.44 → 0.99, elbow 0 → 0.330,
  shoulder 0 → 0.055; guard still engages when an opponent closes.
- **Arms frozen on every non-attack frame** (361/361 idle, 335/335 walk). FIXED — leash, not gate.
- **Only 12 bones were wired**; hands, feet, clavicles, head measured exactly 0.00000 rotation in
  every state. FIXED via exact-name map.
- **No blending anywhere** — the one crossfade wrote `.tgt` before the pose overwrote it. FIXED.

## 2b. THE CAPTURE THAT PLAYED WAS THE WRONG MOTION  ·  2026-08-02  ·  FIXED, ONE OUTLIER LEFT

> "the animations still are not correct cause the animation are still looking procedural"

Two different failures were hiding under one sentence, and only one of them is "procedural".

New `tools/harness/clip_residency.cjs` drives every attack button in every direction and records,
per attack, whether it carried a capture and whether that capture was resident. What it found:

```
FIRE JAB          (LEFT JAB)     played CrotchChop, then HurricaneRana, then FaceGouge
RIP UPPERCUT      (punch)        played Drop Kick (1)
STRAIGHT LEFT     (punch)        played Drop Kick (1)
OVERHAND LEFT     (punch)        played SchoolBoySuperkick
LEAD BACKFIST     (RIGHT CROSS)  played HurricaneRana
OVER-THE-ROPE FOREARM            played CrotchChop   — a TAUNT
```
Those captures are real, resident and animating perfectly. **They are the wrong motion for the
move**, which looks worse than no animation. Cause: `__slotClipRotate` buckets a move into a coarse
slot (`ST_F_LIGHT`) and rotates through whatever the fighter has there — and those pools were built
off each clip's `cat`, so a punch slot legitimately held kicks, a rana and a taunt. It also ran LAST
and unconditionally, so it overwrote `combat_clip_map.json`'s limb-matched choice every time.

- **`BANNON_CLIP_FIT`** reads `engine` and `cat` out of `fbx_move_map.json` (STRIKE_PUNCH /
  STRIKE_KICK / VERTICAL_SUPLEX / TAUNT / LOCO / SELL …) and refuses a capture whose engine
  contradicts the move's own limb. Nothing that is a fall, a getup, a walk cycle or a rig test can
  be anyone's offence. A dual-purpose impact-taunt is still a strike when the entry says so.
- **`__resolveMoveClip`** replaces the three competing lines in `poseAttack` with ONE order of
  authority: what the player EQUIPPED > the limb/trajectory map > variety — and variety may only
  substitute a capture that fits. A final fit-filtered fallback means a move whose limb we know
  never plays nothing.
- **`CrotchChop` relabelled in the DATA.** It was `cat:'strike'`, `engine:'STRIKE_PUNCH'` — a label
  CLAUDE.md's own OWNER LAW cites as the headline example of a guess: the frames show both hands
  crossing at the pelvis with no forward extension and no target. It is a taunt. It is now recorded
  as one, with the reasoning in the file. Nothing deleted; it stays available as a taunt.

MEASURED after: **fit refused 59–70 of every ~94 rotation picks** — that refusal rate IS the
mismatch that used to ship. `resolved 84 of 84` (map 37, fit-fallback 33, rotate 14), and 13 of 14
sampled attacks played a capture matching their own limb.

**STILL OPEN, honestly:** `LEO CROSS` alone ends with no capture, 6–10 times per session, even
though `__combatClipFor('LEO CROSS')` returns `Combo Punch` on demand, that capture is resident, and
`poseAttack` neither throws nor returns early for it. Every other move in the same table resolves.
Not yet explained; not claimed as fixed.

## 3. STRIKE / GRAPPLE ANIMATIONS TOO FAST TO SEE  ·  OPEN (strike fixed, grapple not)

> "the animations are happening at so fast speeds that u can't see the animations on strikes"

`attackPhase` runs 0→1 in ~0.45 s and that phase was mapped onto the WHOLE capture:
JUNGLE_JUICE 2.15 s → **4.8×**, TIGER_FEINT_KICK 4.22 s → **9.4×**, DOUBLESUPLEX 11 s → **24×**.
FIXED for strikes AND grapples. The grapple had the same defect in four more places, each with its
own hardcoded window: stage entry/lift `stateTime/0.55`, carry loop `(stateTime%1.2)/1.2`, victim
`grabTimer/0.6`. `window.__clipPhase` derives the window from the clip. MEASURED, playback speed:
  JUNGLE_JUICE 3.9x -> **1.00x**  ·  TIGER_FEINT_KICK 7.7x -> 1.91x  ·  DOUBLESUPLEX 20x -> 4.98x
  a short 0.40s jab 0.7x -> 0.89x (no longer stretched)

## 4. PROCEDURAL BODIES APPEAR WHEN NOT CHOSEN  ·  repeated 3+ times  ·  FIXED

> "procedural models still appear first and don't change to glb until after u get into choosing
> character, then they switch back to procedural ... should not appear ever unless chose"

`loadFighterModel()` calls `removeFighterModel()`, which unconditionally re-showed the procedural
body — so every re-request flashed it. Plus the models were requested **56.5 s after boot** and took
12–17 s to arrive over localhost because hundreds of clip fetches saturated the connection pool.
FIXED: `keepHidden`, a load-order gate (VIPER.glb 12.1 s → 2.7 s), select-screen prefetch, and a
watchdog so "invisible wrestler" cannot return. Sampled every 250 ms boot→select→match:
**0 violations.**

## 5. SLOW LOADS / THINGS RENDER AFTER YOU ARE ALREADY IN GAME  ·  repeated 4+ times  ·  MOSTLY FIXED

> "we need better wait and load times" · "the slow load on models and things are still broken" ·
> "it lets me press play, then exhibition, then sometimes drops me straight into a match and skips
> fighter selection" · "the model glbs are rendering slowly like I mentioned before"

Load order fixed for fighter models (#4). Two more causes found and fixed 2026-08-02:

**(a) THE FILES WERE ENORMOUS AND UNCOMPRESSED.** `BANNON_rigged.glb` was 11.50 MB of which only
**1% is texture** — the other 11.4 MB is raw float32 geometry, fetched, parsed and uploaded by
`GLTFLoader` **on the main thread** at the moment the match starts. Now EXT_meshopt_compression
(meshoptimizer, MIT, open source — `tools/assets/compress_rigs.cjs`), decoder vendored locally and
registered on the GLTFLoader *prototype* so all seventeen `new THREE.GLTFLoader()` sites get it.
**59 rigs, 345.7 MB → 96.8 MB (72% smaller)**, every one re-read from the written bytes and gated
through `skinqa` before and after, with automatic revert (1 model reverted itself).
BANNON_rigged 11.50 → 3.70 MB, VIPER 5.63 → 1.59 MB, TARZANIAN_DEVIL 13.19 → 3.42 MB.
  - **NEVER QUANTIZE POSITION ON A SKINNED MESH.** Measured through the real gate:
    quantize-including-POSITION is 1.10 MB and **p95 282,517 = destroyed**; quantize-everything-else
    is 1.59 MB and p95 0.0256 (baseline 0.0241). `quantize()` puts the compensating scale on the
    mesh NODE, and a SkinnedMesh does not use its node transform.
  - THE BLOCKER THAT HELD THIS UP FOR MONTHS was diagnosed at the same time. Every gltf-transform
    run died with `Cannot read properties of null (reading 'setMagFilter')`, logged in CLAUDE.md as
    a null sampler. **It is not a sampler.** 54 of our 73 character GLBs carry
    `extensions:{EXT_texture_webp}` on their textures and declare **nothing** in `extensionsUsed`,
    and the reader only runs an extension's preread hook for extensions the file declares — that
    hook is what copies the webp source down to `textureDef.source`. Without it the reader indexes
    `context.textures[undefined]`, the material gets an undefined texture, and
    `getBaseColorTextureInfo()` returns the null. three.js survived it because r128 registers the
    WebP plugin unconditionally, which is why nobody ever noticed. `tools/model_diag/fix_extensions_used.cjs`
    repairs it (and exports an in-memory normaliser the compressor uses).

**(b) THE ROSTER SCREEN WAS DOWNLOADING ALL 121 CHARACTER MODELS AT ONCE**, racing the two fighters
you actually picked. See #1 — portraits are now visibility-gated, and the portrait downloader yields
to `BANNON_LOADORDER.busy()` whenever a wrestler's own body is on the wire.

**Still open:** the skip-fighter-selection race.

## 6. APK WON'T PARSE / INSTALL, NO IN-APP UPDATE PROMPT  ·  repeated 4+ times  ·  OPEN
> "the apk won't parse or install" · "my app is not saying (has an update would u like to install)"

## 7. MOVESET EDITOR — WWE 2K LAYOUT  ·  repeated 3+ times  ·  PARTIAL
> "fighter-select-first → categorized positions/taunts/locomotion" · "the 3d viewport that takes up
> the most and shows u the moves happening as u scroll across them"

Roster was collapsing to one name (`BANNON_ROSTER` assigned twice) — FIXED. **Live preview not done.**

## 8. MOVE VARIANTS, ADDED NOT REPLACED  ·  OPEN
> "we need like swanton bomb 1, 2, 3, shooting star press 1, 2, 3, kneeling powerbomb, powerbomb 1,
> 2, 3, gutwrench powerbomb, suplex, snap suplex, ddt, butterfly ddt, dragon suplex ... so we don't
> replace old animations we add new ones on top like WWE 2k"

## 9. RIGS SHOULD CARRY EVERY BONE THE CAPTURES DRIVE  ·  FINGERS DONE, FACE OPEN
> "our rigs physically can have all those give them to them"

Captures carry 500–888 bone tracks; rigs had 28 joints, so only **7.6%** of tracks could drive
anything. Audited: **1 of 61 rigs had fingers, 0 of 61 had face bones.**
FINGERS DONE — `tools/model_diag/graft_fingers.cjs` grafts five chains per hand onto the EXISTING
skeleton (replacing it wholesale was tried and the gate refused it: VIPER 0.0241 PASS -> 0.0677 WEAK).
60 models grafted, 28 -> 58 joints, and every sampled skinqa verdict is identical to before:
VIPER 0.0241, CIPHER 0.0281, CODY 0.030, BANNON 0.0682, TARZANIAN 0.1089. **Face bones still open.**

## 10. MUSIC CHANGES ON EVERY MENU / ATTIRE CHANGE  ·  OPEN
> "music keeps changing song anytime you change menus, or attire"

## 11. STEEL CAGE DOOR SIDE DISCONNECTED FROM THE RING  ·  OPEN
> "the steel cage side with the door it's disconnected from the ring and door ... not the same length
> all the way down to the ring apron as the other side"

## 12. PAYBACKS / COMEBACKS WITH REAL UNIQUENESS  ·  OPEN
> "mist colors for poison mist, kip up styles, comeback styles"

## 13. ENTRANCE + VICTORY FREEDOM  ·  PARTIAL
> "control your entrance and victory moments and can exit the arena whenever u please"

Broadcast entrances/victories built. **Player control over entering/leaving is not.**

## 14. MORE MDICKIE SURFACING — HARD TIME III / INFINITE LIVES, JAIL + CITY  ·  OPEN

---

## HOW I KEEP FAILING (so I stop)

1. **Judging animation from still frames.** A 0.4 s move at 1.4 FPS gets one frame. Build the
   flipbook (`tools/harness/anim_autopsy.cjs`) or slow the clock — never eyeball a still.
2. **Reporting numbers from a session that never entered a match.** The recorder once reported a
   full set of "match" figures while the game sat on the menu for 42 s. Assert the state first.
3. **Chasing something he never raised** (a white tron screen) instead of his list. This file exists
   so that stops.
4. **Calling something fixed without a number next to it.** He has compared me to the tools that do
   exactly that. A close needs a measurement.
