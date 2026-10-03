# Blitz3D (.bb) ingestion — the MDickie / Wrestling Empire structural interpreter

The owner has a fork of MDickie's **Wrestling MPire / Wrestling Empire** (Blitz3D `.bb` source) and wants
BANNON structured "more like his" — deep per-move logic, a rich position taxonomy, and a booking/career
meta-loop. Blitz3D is flat, procedural, global-variable-heavy plain text. This tool tokenizes it into a
typed AST and **routes each file's payload** to where it belongs in our stack, then **extracts the
structured, reusable knowledge** — it does NOT blindly transpile Blitz into JS/C++ (that would be noise).

## What it does
`node tools/bbparse/bbparse.mjs <in.bb ...> [--moves] --out=<dir>`

1. **Lexer** — line-oriented Blitz parse (`;` comments; `Function..End Function`, `Type..Field..End Type`,
   `Global`, `Const`, `Dim`). Emits `<file>.ast.json`: functions (name/args/line/**call-graph**/doc),
   types+fields, globals, consts, dims. Trailing `;comments` are KEPT — in Blitz they name things.
2. **Domain router** (`DOMAIN` map, from the owner's `parserMappingRules`): classifies each file —
   `AI.bb`/`Gameplay.bb` → native brawler state machine; `Attacks.bb`/`Moves.bb`/`Anims.bb` → C++
   physics params + our move DB; `Career.bb`/`News.bb`/`Promos.bb` → Node meta backend / data repos.
3. **Moves catalog extractor** (`--moves`, auto for `Moves.bb`): pulls every
   `pSeq(cyc,ID)=ExtractAnimSeq(p(cyc),START,END,base) ;name` into `moves_catalog.json` —
   `{id, name, frames:[start,end], length, category, group}`, tagged by the section it sits under.

## What we extracted (committed — derived data only)
`tools/bbparse/out/` holds the DISTILLED output, not MDickie's raw source. As with the "Off The Top
Rope" manuscripts (canon/*.md is committed, the raw .txt is not), **we do NOT commit the `.bb` files** —
they're a third party's copyrighted game. We keep the transformative, factual structural data:
- **`moves_catalog.json`** — 191 standing/grapple moves with animation frame ranges + position tags.
  The MDickie taxonomy at a glance: `lunge → tie-up (aggressor/victim, forward vs original start) →
  tie-up movement → Irish whip [execute]/[receive] → force out/into ring → move animations` (DDT /
  tornado DDT / reverse DDT families, MDKO finishers). This maps onto our `GRAPPLE_POSITIONS` +
  `resolveGrapPos` — the "any move from any position" system — and shows the aggressor/victim PAIRED
  sequence model we already use in `poseGrab`/`poseGrabbed`.
- **`AI.ast.json`** — the 49-function AI state machine map (`GetIntensity`, `FindThreat`,
  `AttackSensible`, `RushViable`, `InProximity`, `InLine`, `NearGrounded`, `TopeViable`, tag/ref
  duty logic). A reference blueprint for deepening `native/include/bannon_referee.h` + the combat AI.
- **`Attacks.ast.json` / `Anims.ast.json` / `Gameplay.ast.json`** — function maps for the strike/anim/
  combat-loop logic (per-move speed = skill-scaled, travel = agility-scaled, height-differential and
  turnbuckle-platform handling — the "Fire Pro per-move logic priority" quality bar).
- **`Values.ast.json`** — 263 balance globals (roster/play limits, timers) — reference for our config.

## How the Bannon Asset Manager auto-parses (owner's pipeline spec)
This CLI is the standalone core of the `bbLexerPipeline` + `astDomainRouter` the owner spec'd for the
Google-AI Asset Manager. To wire it into the daemon's autonomous chain: on a new `.bb` drop, run the
lexer → route by `DOMAIN` → feed physics/move nodes to the C++/move-DB generators and meta/text nodes
to the Node templates; on a lexer break, log `FAIL` to the CycleLogger before anything hits the repo.
The extraction is deterministic and idempotent, so it's safe to re-run on every sync.

## Next (queued)
- Map `moves_catalog.json` frame-range families → `MOVESET_DB` entries wired through `resolveGrapPos`
  (our real physics, not frame playback) so the MDickie breadth informs our position library.
- Distill `Attacks.bb` per-move force/recoil numbers → `bannon_strike.h` tuning references.
