# BANNON GAP PLAN — North-Star Build Plan

Date: 2026-10-05. Statuses are **code-search-based** (file presence + symbol references in mhvnsnt/Bannon), not runtime-verified — per owner protocol, treat as "seen in code, not yet seen running" until a build proves otherwise. Confidence noted per item.

## Status map

| # | Target mechanic | Source | BANNON status | Touches |
|---|---|---|---|---|
| 1 | Shot Caller (live spot-calling) | UV signature | **NOT BUILT** (high conf — zero refs) | new system; feeds `MatchDirector.ts` |
| 2 | Combo/rhythm scoring (moves + taunts linked, Tony Hawk-esque) | UV | **NOT BUILT** (high conf — zero refs) | strike system, new `BANNON_FLOW` module |
| 3 | Turnbuckle smashes | NB named feature | **PARTIAL** (med conf — `BannonTurnbuckleDeformationPhysics.h`, `BannonArena.h` mention `BANNON_BUCKLES`, `CombatEngine.ts` refs; but `exposeTurnbuckle`/`trapInCorner`/`climbTurnbuckle` names appear only in docs — actual export surface needs verification) | turnbuckle API, corner grapple states |
| 4 | Ragdoll blend driven by impact | NB principle | **PARTIAL** (high conf — `BANNON_IMPACT` kinetic multiplier built & parity-checked; PD/`bannon_rig` exist; blend currently shallow) | `BANNON_IMPACT`, `Spring3`, `bannon_rig` |
| 5 | Light tubes (ropes + exploding) | UV + NB | **NOT BUILT** (high conf — zero light-tube refs; `shatter` weapon class exists, 49 refs) | shatter class, rope system |
| 6 | Rope tangling | NB named feature | **NOT BUILT** (high conf — zero refs; rope kinematics exist) | rope kinematics |
| 7 | Create-A-Ring: per-side ropes + layered destruction (mat → boards → wire netting) | UV | **NOT BUILT** (med conf — ring/venue systems exist, no per-side config or destruction layers found) | venue/arena system, rope system |
| 8 | Create-A-Weapon authoring | UV | **PARTIAL** (high conf — 34 MDickie weapons classified + weaponized; no authoring UI) | weapon system, creation suite |
| 9 | Crowd-thrown weapons | UV | **NOT BUILT** (med conf) | crowd system, weapon spawn |
| 10 | Table scaffoldings / six-table structures | UV | **PARTIAL** (med conf — TLC tables/ladders exist; scaffold structures not framed) | table/ladder physics |
| 11 | Dive height tiers (balcony/ladder heights as parameters) | NB | **PARTIAL** (med conf — dives exist, "perfect" per owner; no height tiers) | dive system |
| 12 | Crowd Momentum → performance | NB | **PARTIAL** (med conf — `crowdReaction` exists: `server/crowdReactionSystem.js`, UE `BannonCrowd`; whether crowd state feeds wrestler stats is unverified) | crowd system, stat modifiers |
| 13 | Overexertion (lifts) | NB | **BUILT** (high conf — `BANNON_LIFT_CHECK` parity-checked; failed lifts cost stamina) | extend to rope breaks, kickouts, submissions |
| 14 | Impact variance ("no two impacts same") | NB | **BUILT** (high conf — `BANNON_IMPACT`, 2.41x measured spread, clamped envelope) | extend into ragdoll blend (see #4) |
| 15 | Reversal meter | UV (footage) | **PARTIAL** (low conf — reversal prompt concept in controls spec; implementation unverified) | reversal system |

UV = UltraViolence Pro Wrestling, NB = Neckbreaker: Visceral Pro Wrestling.

## Priority ranking (validated against fresh research)
The standing doc ranked Shot Caller #1. **Confirmed — keep it.** It is the signature mechanic of one north star, exists in no shipping wrestling game, and BANNON already owns the adjacent `MatchDirector` narrative layer it can plug into. Combo/rhythm stays #2 (Arkham-lineage flow is the other half of the UV identity).

## Build tasks (in order)

### P1 — SHOT CALLER: live spot-calling layer
- **What:** a match-time "director" system. Before/during a match, spots (sequences: e.g., "whip → corner → turnbuckle smash → dive") can be *called*. Executing a called spot builds crowd heat + a score multiplier; improvising off the called sequence is allowed but forfeits the bonus and adds chaos variance. AI booker can call spots for/against the player.
- **Extends:** new module (proposed `BANNON_SHOTCALLER`); feeds results into `MatchDirector.ts` rivalry heat + `crowdReaction`.
- **Acceptance:** in a test match, calling a 3-move spot and executing it in order yields a visible heat/multiplier gain vs. the same moves uncalled; the AI visibly calls and pursues its own spots. Logged to the match record.

### P2 — Combo/rhythm scoring (BANNON_FLOW)
- **What:** timing-window chaining — strikes/grapples/taunts linked within rhythm windows build a flow score with escalating multiplier; mistimed inputs drop the chain. Taunts count (UV's Tony Hawk-esque design).
- **Extends:** strike system + new `BANNON_FLOW`; consumes `BANNON_IMPACT` multiplier as chain weighting.
- **Acceptance:** a 5-input chain with correct timing outscores the same 5 moves unchained by a documented margin; a broken-timing run scores lower; taunt links register.

### P3 — Wire the turnbuckle API
- **What:** first verify the real export surface (the doc-named `exposeTurnbuckle`/`trapInCorner`/`climbTurnbuckle` don't appear in code — find what actually exists in `BannonTurnbuckleDeformationPhysics.h` / `BannonArena.h` / `CombatEngine.ts`), then wire turnbuckle smashes into grapple resolution with deformation + damage.
- **Extends:** existing turnbuckle code; corner grapple states.
- **Acceptance:** whipping an opponent into an exposed turnbuckle produces deformation + damage scaled by `BANNON_IMPACT`; padded vs. exposed is measurably different.

### P4 — Impact-driven ragdoll blend
- **What:** feed the `BANNON_IMPACT` kinetic multiplier into ragdoll blend weight on hits — bigger kinetic events push further toward full ragdoll, small ones stay animated.
- **Extends:** `BANNON_IMPACT`, `Spring3`, `bannon_rig` PD controllers.
- **Acceptance:** identical move at low vs. high kinetic multiplier shows visibly different ragdoll takeover (record blend-weight curves for both).

### P5 — Light tubes + rope tangle
- **What:** (a) light-tube weapon/ropes: shatter-class instances with particle + bleed hooks; (b) rope-tangle state: opponent caught in ropes becomes a grapple position with escape struggle.
- **Extends:** shatter weapon class; rope kinematics.
- **Acceptance:** light-tube strike shatters with debris + damage; a whipped opponent can end tangled, with a working escape mini-state.

### P6 — Deathmatch logistics pack
- **What:** (a) Create-A-Ring: per-side rope config (normal / barbed / none / light-tube) + layered destruction (mat → boards → wire netting); (b) crowd-thrown weapons events; (c) table scaffold structures; (d) dive height tiers as real parameters.
- **Extends:** venue/arena system, rope system, table/ladder physics, dive system, crowd system.
- **Acceptance:** a custom ring with one barbed side behaves differently per side in a test match; mat tear-up exposes boards with changed bounce/damage; a 20ft dive out-damages a top-rope dive by the documented curve.

### P7 — Create-A-Weapon authoring UI
- **What:** player-facing builder on top of the 34 classified weapons: pick base + modifications (barbed, electrified, taped fists…), with stat tradeoffs.
- **Extends:** weapon system, creation suite (`BANNON_CAW_FRONT` / `BANNON_CREATION_SUITE`).
- **Acceptance:** a built weapon appears in-match with its stats and persists in the moveset.

### P8 — Crowd Momentum → performance coupling
- **What:** verify whether `crowdReaction` currently feeds wrestler stats; if not, close the loop: crowd energy state applies small performance modifiers (comeback boosts, gassed penalties).
- **Extends:** `server/crowdReactionSystem.js`, UE `BannonCrowd`.
- **Acceptance:** identical wrestler at high vs. low crowd energy shows a measured stat delta in a controlled test.

### P9 — Overexertion extended
- **What:** apply the `BANNON_LIFT_CHECK` struggle model to rope-break escapes, kickouts, and submission escapes.
- **Extends:** `BANNON_LIFT_CHECK`.
- **Acceptance:** a gassed wrestler fails a heavy kickout they would make fresh; the attempt still costs stamina.

## Non-goals / IP guardrails
- Do not copy real wrestler names/likenesses (UV's G-Raver, Ruckus, etc.), real promotions, or any trademarked terms. Systems and design DNA only.
- Do not reproduce the other games' code, art, or text — everything above is re-implemented from described mechanics in BANNON's own engine and universe.
- Outreach: no response as of 2026-10-05. No partnership claims. If they reply later, the plan adapts; until then, this is our own game.
