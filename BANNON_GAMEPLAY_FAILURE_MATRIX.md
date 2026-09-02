# BANNON — GAMEPLAY FAILURE MATRIX

Built from **live measurement**, not from a taxonomy copied off a forum. The
contradiction detector in `tools/harness/smoke.cjs` samples both fighters every
100 ms and flags states that **cannot both be true**. That needs no prior theory
about what broke, which is the point — the owner can tell the game is wrong
without being able to name the bug.

Every field checked was measured off a live fighter first. `y`, `vy`,
`downTimer`, `getUpT` and `blocking` **do not exist** on a fighter object;
nothing here is written against a hoped-for field.

## FIRST RUN — three contradictions, 79 samples

| Contradiction | Rate | Evidence | Triage |
| --- | ---: | --- | --- |
| `ZONE_HEIGHT_MISMATCH` | 3/79 | `BANNON zone=FLOOR expects y=-0.85 but zoneY=0.000` | **CANDIDATE DEFECT — highest priority** |
| `TELEPORT` | 11/79 | `BANNON moved 10.92m in one 100ms sample, state=walk` | **CANDIDATE DEFECT / possibly legitimate reposition** |
| `INTERPENETRATION` | 1/79 | `two fighters 0.000m apart with no grapple` | CANDIDATE — likely spawn frame |

**A contradiction is not yet a confirmed bug.** Either the engine believes two
incompatible things, or the check is wrong. Both are worth knowing, and each
needs triage before a line of fix code is written.

### 1. `ZONE_HEIGHT_MISMATCH` — the waist-deep clip, still reachable

`CLAUDE.md` records v161l fixing exactly this: five code paths disagreed on
`ZONE_Y.FLOOR` (-0.72 vs -0.85) and a fighter rendered ~13 cm off, clipping
through the mat. All paths were unified on `ZONE_Y`.

The detector still catches `zone=FLOOR` with `zoneY=0.000` — a **0.85 m**
disagreement, far past the 0.35 tolerance that allows for the documented 8x/6x
smoothing lerp. So either a path still sets `zone` without `zoneY`, or the two
are updated on different frames and the gap is a transient.

**Next step is triage, not a fix:** capture `zone`, `zoneY`, `_smoothZoneY` and
`_zoneHold` together across the transition and determine whether the mismatch
persists or is one frame of lag. **Do not widen the tolerance until it stops
firing** — that is hiding a synchronisation problem, which the standing rules
forbid.

### 2. `TELEPORT` — 10.92 m in 100 ms

`MAX_BODY_VEL` is **3.8 m/s**, so 100 ms of legitimate motion is at most 0.38 m.
10.92 m is **109 m/s** — a position *set*, not a move.

**This may well be legitimate**: a bell-time placement, an entrance handoff, or a
zone change repositioning the body. 11 of 79 samples is high enough that it is
probably a normal engine operation the check does not yet know about.

**Triage first:** record the state and the wall-clock offset of each jump and
correlate with match start / entrance / zone transition. If they cluster at those
events, the CHECK is wrong and must learn to exclude them. If they happen
mid-walk, the ENGINE is wrong.

### 3. `INTERPENETRATION` — exactly 0.000 m

Two bodies at identical coordinates. `0.000` rather than a small number suggests
both at spawn defaults before placement, i.e. one frame at match construction.
Lowest priority; verify it is confined to the first samples.

## The eight checks, and what each is for

| Check | Failure class it catches |
| --- | --- |
| `RAGDOLL_WHILE_STANDING` | animation/physics authority fight |
| `GRAPPLE_STAGE_WITHOUT_GRAPPLE` | state machine in an impossible state |
| `ZONE_HEIGHT_MISMATCH` | character penetration / waist-deep clipping |
| `HP_OUT_OF_RANGE`, `STAMINA_OUT_OF_RANGE` | bounded quantity escaping its bounds |
| `TELEPORT` | unexpected displacement |
| `STUCK_TIMER` | wedged in a state |
| `GRAPPLE_AT_RANGE` | two-character animations drifting apart |
| `INTERPENETRATION` | collision response failure |

Five of the eight did **not** fire, which is as useful as the three that did:
no ragdoll/standing conflict, no orphan grapple stage, no out-of-range HP or
stamina, no runaway stuck timer, and no grapple claimed at range in this run.

## AUTHORITY: what the branch search found

Per the hierarchy — canonical Bannon first, then branches, then owned repos,
then external open source — the branches were searched **before** any
replacement was considered.

```
branch                                    BANNON_v150.html   merge-base with main
main                                           60,064
integration/bannon-engine-content-recovery     61,411        (3 behind, 12 ahead)
claude/grapple-solver-model-fixes-oar0pg       61,411        NONE
feat/normalize-fbx-and-logging                 54,078        NONE
claude/bannon-dna-native-port-digjqw           35,394        NONE
claude/aaa-bannon-leg-stepping-sdwcjb          35,021        NONE
Branch-2                                       33,592        NONE
rescue/aistudio-main-8be335c                    1,302        NONE
```

**`ahead=1 / behind=376` was meaningless.** Every one of those branches is an
ORPHAN ROOT — a full-tree snapshot with **no shared history** with main, so git's
ahead/behind counts compare unrelated graphs. Reading them as "1 commit of new
work" would have been wrong in both directions.

**The real finding: `claude/grapple-solver-model-fixes-oar0pg` carries 1,347
lines MORE than main, and is a strict SUPERSET** — four modules main does not
have, and **zero** modules main has that it lacks:

```
BANNON_APPEARANCE   BANNON_APPEARANCE_STUDIO   BANNON_SCULPT   BANNON_POSTWARM
```

Its `BANNON_v150.html` is **byte-identical (sha256 2eca50ba…)** to
`integration/bannon-engine-content-recovery`'s, so that branch already carries
this work — they are not two separate recoveries.

`BANNON_APPEARANCE` / `BANNON_SCULPT` / `BANNON_APPEARANCE_STUDIO` are character
customisation, and `CLAUDE.md` carries an OPEN owner item for exactly that:
*"Facial hair add/remove + tattoo editing in character customisation."*

**The branch name is misleading and would have wasted a search.**
`grapple-solver-model-fixes` contains no grapple solver — its commit message is
*"Deleted the shader queue I just built, because measuring it honestly said to"*.
The name describes the session, not the diff. **Read the diff, never the branch
name.**

## Status

`STRUCTURALLY_VERIFIED` — detector built, run, and three contradictions captured
with evidence. **No fix has been written and no branch has been merged.** The
next step is triage of the three candidates, in the order above.
