# BANNON NORTH STARS — researched references (standing requirement)

The owner made this a **standing rule (2026-07-25)**: research these every session and keep pulling from
them. They sit *on top of* the existing MDickie + WWE-2K goals, not instead of them.

---

## 1. ULTRAVIOLENCE PRO WRESTLING (unreleased) — dev "Adam" / @Gackdaw / @UVWPRO

**Relationship:** the owner is ON Adam's team. Adam suspended release indefinitely for lack of a team and
brought the owner in; the owner has the go-ahead to recreate and build on his game and systems, keeping
BANNON as our own game in our own universe, and to exchange progress both ways.

**What it is:** solo-developed pro-wrestling game centred on the **deathmatch sub-genre** — specifically
"the logistics of deathmatches" more than anything else. Developer has ~14 years in the industry and was
on the development team for the **Arkham** games (so expect Arkham-grade combat-flow thinking:
rhythm, counters, chained encounters).

**Named mechanics to mirror in BANNON:**
| Their mechanic | BANNON status |
|---|---|
| **Shot Caller** — their signature mechanic | NOT BUILT. Highest-value gap. Reads as calling the spots / directing the match live. |
| **Combo system** | PARTIAL — strikes exist, no true chaining/rhythm layer. |
| **High spots** | PARTIAL — dives/apron/top-rope exist; not framed as escalating "spots". |
| **Create-a-weapon** | PARTIAL — 34 MDickie weapons classified + weaponized; no authoring UI. |
| **Light-tube ropes** | NOT BUILT (we have rope kinematics + shatter class to build on). |
| **Six table scaffoldings** | PARTIAL — TLC tables/ladders exist. |

## 2. NECKBREAKER: VISCERAL PRO WRESTLING — Steve Masson (@StevoMasson), on Steam

**What it is:** a **physics-driven** indie pro-wrestling game built on an **active-ragdoll** engine.

**The core principle, in their own words:** the active physics system affects **every grapple, slam and
strike, leaving no two impacts the same**. Every slam and takedown gets a realistic feel from the
active-ragdoll engine. You either **power through with extra strength, or feel the OVEREXERTION as you
struggle to lift your opponent**.

**Environment as a weapon:** smash opponents into turnbuckles, get tangled in the ropes, dive from a
20-foot balcony, smash through tables, explode light tubes, dive off 20ft ladders, pick up foreign
objects.

| Their principle | BANNON status |
|---|---|
| "No two impacts the same" | **BUILT 2026-07-25** — `BANNON_IMPACT` kinetic model (below). |
| Overexertion on lifts | **BUILT 2026-07-25** — `BANNON_LIFT_CHECK`. |
| Active ragdoll everywhere | PARTIAL — PD springs + `bannon_rig` exist; ragdoll blend on hits is shallow. |
| Tangled in the ropes | NOT BUILT (rope kinematics exist). |
| Turnbuckle smashes | PARTIAL — `BANNON_BUCKLES` exists but its exports are UNUSED. |
| Explode light tubes | NOT BUILT (shatter weapon class exists). |
| 20ft balcony/ladder dives | PARTIAL — dives exist and are "perfect" per owner law; height tiers not built. |

---

## OPEN-SOURCE GROUNDING (owner law #6 — pull from open source, don't hand-roll)

- **Active-ragdoll practice:** the standard approach is state transitions between animated and ragdoll
  via **IK + interpolation**, with **PD controllers** maintaining posture after impact. BANNON's
  `Spring3` is already an analytical critically-damped PD integrator, and `native/include/bannon_rig.h`
  supplies kp 900 / kd 60 — so *the architecture was already correct*; what was missing was impact
  VARIANCE, which is what `BANNON_IMPACT` adds.
- **Bullet Physics** (zlib) — reference for continuous collision detection if/when native needs it.
- Already pulled: **UniRig** (re-rig), plus our own `transfer_weights.cjs` when the hosted service
  degraded; **Google GNM** (Apache-2.0) for the scan-grade parametric head; FBXLoader/fflate vendored.

---

## WHAT WAS BUILT AGAINST THIS (2026-07-25)

`BANNON_IMPACT` — the kinetic impact model. Damage previously arrived from **move.power tables** with
categorical body-part routing, so a flat-footed jab and a full-speed lariat resolved through identical
arithmetic. That is exactly why hits read as puppets. It now measures real kinematics already present in
the engine at the moment of contact:

* the striking limb's **joint velocity** (`Spring3` integrates true per-joint velocity),
* the attacker's **mass build** (BBODY musc/fat),
* the attacker's **fatigue** (gassed shots land softer),
* **closing direction** — walking into a shot is a counter, rolling away softens it,

and derives ONE multiplier that scales damage, hit-stop, camera punch and the crowd pop together.
Measured spread on an identical move: **2.41x**, envelope clamped 0.55–2.05 so nothing one-shots.

`BANNON_LIFT_CHECK` — overexertion. Fresh powers through anyone; half-gassed keeps a light opponent but
loses a heavyweight; fully gassed loses anyone. Wired into the grapple carry, and a failed lift still
costs stamina.

## NEXT AGAINST THESE NORTH STARS (highest value first)
1. **SHOT CALLER** (Ultraviolence's signature) — nothing like it exists in BANNON yet.
2. **Combo/rhythm layer** — chain strikes with timing windows (Arkham-lineage flow).
3. **Wire `BANNON_BUCKLES`** — `exposeTurnbuckle` / `trapInCorner` / `climbTurnbuckle` are BUILT and
   UNUSED; turnbuckle smashes are a named Neckbreaker feature.
4. **Deeper ragdoll blend on impact** — push the kinetic multiplier into ragdoll blend weight, not just
   damage and camera.
5. **Light tubes + rope tangle** — both have foundations (shatter class, rope kinematics).

## SOURCES
- https://x.com/UVWPRO
- https://www.fightful.com/wrestling/ultra-violence-wrestling-game-developer-provides-update-game/
- https://dailyddt.com/2021/09/24/ultra-violence-video-game-preview/
- https://store.steampowered.com/app/3083730/Neckbreaker_Visceral_Pro_Wrestling/
- https://steambase.io/games/neckbreaker-visceral-pro-wrestling/info
- https://x.com/StevoMasson/status/1827486268827299994
- https://github.com/rmguney/active-ragdolls
- https://github.com/raduacg/game-mechanics-optimizations/blob/main/117_ragdoll_blending.md
