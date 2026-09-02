# BANNON WEB ENGINE — MODULARIZATION PLAN

`BANNON_v150.html` is 60,065 lines. This plan says which piece comes out first
and why, measured by `scripts/web_module_graph.cjs` rather than chosen by
intuition.

**No rewrite. One bounded module at a time, with the game working after each.**

---

## FINDING 1 — it is not an undifferentiated monolith

```
149 top-level `window.BANNON_*` modules
```

The engine already namespaces its subsystems. This is not "decompose a
monolith"; it is **extract along seams that already exist**. That is a far
cheaper job than the line count suggests, and it changes the shape of the work.

## FINDING 2 — the dependency structure is heavily skewed

| Apparent inbound edges | Modules |
| ---: | ---: |
| 1 | 63 |
| 2 | 37 |
| 3 | 20 |
| 4–7 | 19 |
| 8+ | **6** |

Two thirds of the file sits at one or two edges. Only **six** modules are hubs.
That is the shape you want: a long tail of near-isolated code and a small core.

**The hubs — extract LAST:**

| Module | Inbound | Lines |
| --- | ---: | ---: |
| `BANNON_STORY` | 19 | 170 |
| `BANNON_UNIVERSE` | 15 | 248 |
| `BANNON_ENVIRONMENTS` | 10 | 105 |
| `BANNON_ROSTER` | 9 | 24 |
| `BANNON_FX` | 8 | 67 |
| `BANNON_LIFE` | 8 | 1,085 |

Note these are SMALL. The hubs are not where the bulk is — they are shared
vocabulary. `BANNON_DNA` is the bulk: **16,765 lines, 42 outbound edges**. It is
last for size, not for coupling.

## FINDING 3 — the measurement had to be fixed twice, and that is the lesson

The first version counted plain substrings across the raw file. It reported that
**every** module had at least one inbound edge and no safe extraction existed.

Checking three by hand:

| Module | Its "inbound edges" |
| --- | --- |
| `BANNON_MOVESET_STUDIO` | one `//` comment, two `console.log` strings |
| `BANNON_EDITOR` | one `/* ... */` comment |
| `BANNON_STATS` | one `//` comment |

**All three were real leaves the instrument had hidden.** Two fixes followed:
comments and string literals are stripped before analysis, and references match
on word boundaries — `BANNON_TRON` is a prefix of `BANNON_TRON_STUDIO`, so plain
substring matching counted every mention of the longer module as a reference to
the shorter one.

**An over-counting measure is not "conservative". It produced the wrong answer
outright**, and would have led to "the file cannot be safely split".

## FINDING 4 — what the tool still cannot do

A module's span is taken as *declaration line → next declaration line*. That is
**line-based, not scope-based**, so ordinary engine code sitting after a
declaration is attributed to it and can manufacture an edge no function has.

So the counts are an **UPPER BOUND**, and the shortlist is a shortlist, not a
verdict. The ordering is sound — a module with one apparent edge really is more
isolated than one with nineteen — but every candidate's remaining edges must be
read by hand. A precise answer needs a real JS parser; this is a cheap
approximation that says so out loud.

---

## The extraction order

**Tier 1 — verified leaves.** Hand-checked: no real referencing code.

| Module | Lines | Needs |
| --- | ---: | --- |
| `BANNON_EDITOR` | 54 | `BANNON_RULES` |
| `BANNON_STATS` | 55 | `BANNON_UNIVERSE` |
| `BANNON_MOVESET_STUDIO` | 282 | `BANNON_REACH` |

**Tier 2 — shortlist, one apparent edge, hand-check before each.**
`BANNON_TRON_STUDIO` (8), `BANNON_MDICKIE_PROPS` (1), `BANNON_TELEMETRY_NDJSON`
(3), `BANNON_BUILD_INFO` (14), `BANNON_PREFETCH_COMBAT` (22), `BANNON_MOCAP_LOAD`
(26), `BANNON_DIALOGUE` (33), `BANNON_IMPACT` (41), `BANNON_CLIPWORKER` (52),
`BANNON_MOCAP_CORE` (61), `BANNON_AUTHORED` (66), `BANNON_SAVE_SCOPE` (68),
`BANNON_BASES_OFF` (73) — 63 in total at this level.

**Tier 3** — the 2–7 edge middle. **Tier 4** — the six hubs. **Tier 5** —
`BANNON_DNA`.

## The loop, per module

```
run the harness, record behaviour   (scripts/ + the bannon-verify skill)
        ↓
move ONE module to its own file
        ↓
re-include it, keep window.BANNON_X exactly as it was
        ↓
run the harness again — same behaviour, 0 page errors
        ↓
commit. next module.
```

`window.BANNON_X` stays the public name throughout. Nothing else in the file has
to change, which is what keeps each step reversible.

## Two independent references for where the boundaries fall

Neither is a merge candidate; both are worked examples in the same domain.

| `CODEDUMMY` (root modules) | `Wrestli6game-3` (`src/engine/`) |
| --- | --- |
| `KinematicCore` | `physics.ts` |
| `PhysicsCollider` | `character3d.ts` |
| `CombatAI` | `fighter.ts` (74 KB) |
| `MatchDirector` | `referee.ts` / `referee3d.ts` |
| `CharacterForge`, `CharacterModelGen` | `moveLibrary.ts` |
| `FXRenderer`, `AudioSynth` | `effects.ts`, `audio.ts` |
| `SpatialEnvironment`, `InputMatrix` | `moves.ts`, `roster.ts` |

Where all three agree a boundary exists, it is probably a real one.

## Status

`STRUCTURALLY_VERIFIED` — measured, ordered, three candidates hand-verified.
**No module has been extracted. No line of `BANNON_v150.html` has changed.**
