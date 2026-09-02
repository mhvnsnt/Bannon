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

## BLOCKER FOUND ATTEMPTING TIER 1 — a naive extraction breaks the phone

I took the harness baseline, read `BANNON_EDITOR` (a clean 54-line IIFE with, on
inspection, **zero** real dependencies — the `BANNON_RULES` edge the graph showed
is the span artifact described in Finding 4), and was ready to move it to
`src/modules/editor.js`.

**Checking the shipping path first stopped it.** Both delivery mechanisms assume
ONE file:

```
OTA   BANNON_v150.html  ->  dist/BANNON.html   (android.yml: cp, one file)
      the app fetches dist/version.json, downloads dist/BANNON.html, swaps it

APK   scripts/bundle_apk_assets.cjs copies a FIXED directory list:
        assets/vendor, assets/ring, assets/models/props,
        assets/models/mdickie_char, assets/mocap/open, assets/tron
      `src/` is not in it, and would not be bundled.
```

So `<script src="src/modules/editor.js">` would 404 twice over: not present in
the APK, and never delivered by an OTA update that ships only the HTML. The
module would silently vanish on the device while working perfectly in a browser
served from the repo — **exactly the failure recorded in `CLAUDE.md` as "the APK
had no models in it"**, where the code was debugged for a week and the asset was
simply absent.

### The fix: split the SOURCE, ship ONE file

Extraction must be paired with a build step that concatenates back:

```
src/modules/*.js  +  BANNON_v150.src.html
        │
        ▼  build step (new)
   BANNON_v150.html          <- one file, byte-identical contract
        │
        ├── dist/BANNON.html   (OTA swap, unchanged)
        └── APK bundle         (unchanged)
```

Developers edit modules; the shipped artifact stays a single file, so the OTA
single-file swap, the cold-launch `document.write` bootstrap and the APK bundle
all keep working untouched.

**This build step does not exist yet, and it is now the first task — before any
module moves.** Its own gate is cheap and non-negotiable: the concatenated
output must be byte-identical to the current file when no module has been
extracted yet, which proves the build is a no-op before it is trusted with real
splits.

The alternative — extracting into a directory the bundler already copies
(`assets/`) — is rejected: it makes engine source an "asset", still needs the
OTA path to deliver it, and scatters the code across two trees for no gain.

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

## Harness baseline, taken before any change

`node tools/harness/smoke.cjs` on the current file, so a later extraction has
something to be compared against:

```
strike   poseCalls 24   walk  poseCalls 18   grapple  poseCalls 0
frames 126 in 59.5s (2.12 fps)   worst stall 4012ms
states  walk 28, attack 15, idle 61, hurt 1, block 1, vault 3, dive 8,
        falling 1, stumble 13
2 FAILURES: BANNON / VIPER have no GLB bound
```

The two model failures are **pre-existing in this sandbox** and are the baseline,
not a regression to chase here. An extraction is correct when these numbers come
back the same.

(`playwright` was not installed; `npm install --no-save playwright` with
`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` is enough — the browser is already at
`/opt/pw-browsers`.)

## Status

`STRUCTURALLY_VERIFIED` — measured, ordered, three candidates hand-verified,
baseline captured, and the shipping blocker found before it did any damage.

**No module has been extracted. No line of `BANNON_v150.html` has changed.** The
next task is the concatenating build step, not a module move.
