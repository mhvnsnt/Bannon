# Clip → Move: the whole flow, one command

You drop clips in. You run one thing. They're playing on moves.

```
cp  your-clips/*.fbx   assets/mocap/          # or .bvh, or .glb with animation
node tools/mocap/ingest.cjs
cp BANNON_v150.html index.html && cp BANNON_v150.html public/index.html
```

That's it. `--dry` first if you want to see what it would do without changing anything.

## What the command actually does

| step | what happens |
|---|---|
| **1. scan** | walks `assets/mocap/**` for any `.fbx` / `.bvh` / `.glb` the index has never seen |
| **2. classify** | reads each filename → category, ring position, engine key, fighting styles |
| **3. index** | appends to `assets/moves/fbx_move_map.json` — **the file everything else reads** |
| **4. map** | re-runs the library mapper and the combat mapper so moves bind to the new clips |
| **5. retreat** | re-runs the procedural generator so pose-math clips step aside wherever a real capture now covers the position |
| **6. report** | prints what each clip became, and coverage before vs after |

Every step is idempotent. Running it twice changes nothing the second time.

**Step 3 is the one that was missing.** Every mapper in the project keys off `fbx_move_map.json`, and
nothing ever added a clip to it. You could drop fifty captures in and all fifty stayed invisible —
files on disk, no move referencing them, looking exactly like "the import didn't work".

## Formats

| format | supported | notes |
|---|---|---|
| `.fbx` | yes | what the existing 202 clips are |
| `.bvh` | yes | what almost every free/CC0 set ships in — CMU, Truebones, 100STYLE |
| `.glb` | yes | only if it carries animation; the MDickie GLBs do not |

BVH support is recent. Before it, no free mocap was usable at all regardless of how much arrived.

## Naming matters, because the filename is the classifier's only signal

Good names classify themselves:

```
Running Clothesline      -> strike     RUNNING
Top Rope Moonsault       -> dive       TURNBUCKLE_TOP
German Suplex            -> grapple    STANDING_FRONT
Armbar Submission        -> submission GROUNDED_HEAD_UP
Getting Up From Ground   -> getup      GROUND_TO_STANDING_WAKEUP
Corner Dropkick          -> strike     CORNER_FRONT
Capoeira Armada          -> strike     STANDING_FRONT  [lucha, highFlyer]
```

Opaque names cannot be:

```
subject_86_trial_02      -> misc       STANDING_FRONT     <- CMU's raw naming
```

They still ingest and still work — `misc` gets a usable default — but they land in a generic slot.
If a pack ships an index of what each file contains, rename from it before ingesting and you get the
right position for free. The report lists every `misc` so you can see what needs a rename.

## Rules of the pipeline

- **A real capture always beats pose math.** Procedural clips register as `PROC_<slot>` and are only
  reached after an equip, the position's capture, and the alias chain have all missed. Adding
  captures silently upgrades whatever they cover — you never have to remove anything.
- **A manual equip always beats the auto-map.** What you set in the Move Set editor wins, always.
- **Rigs are excluded.** `X Bot`, `crash_dummy`, `*_nonPBR`, `*IKRig*` are skeletons, not actions,
  and are never offered as a move.

## Licensing — this is a commercial game

| source | licence | ship it |
|---|---|---|
| CMU Graphics Lab Motion Capture Database | free for all uses | yes |
| Truebones CC0 packs | CC0 | yes |
| Mixamo | royalty-free in a product | yes |
| AMASS, SFU, most academic sets | research only | **no** |
| Ubisoft LAFAN1 | non-commercial | **no** |

Record every pack's source and licence in `assets/mocap/open/LICENSES.md` as you add it. Nobody
remembers where a clip came from six months later, and an unrecorded clip has to be treated as
unusable.

## Checking coverage any time

```
node tools/mocap/ingest.cjs --report
```

Current: 184 clips indexed, 15 ring positions covered, 215 of 350 moveset picks on real capture,
137 combat moves mapped, the rest on pose math.
