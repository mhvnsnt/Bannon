# Statue → Game Character Pipeline

**What this is:** You make "statue" models with Tripo AI — they look great standing
still, but they can't move, fight, or play. This pipeline turns a statue into a
working game character. Read it top to bottom once; after that, the agents run it
and you only get called in for two things (marked YOUR HANDS below).

**The deal:** every stage that a machine *can* do, a machine *does*. You only touch
what machines genuinely can't: artistic judgment calls. That's the whole design.

---

## The stages

### 1. INTAKE — "Is this statue usable?"
**What:** We load your Tripo file and check the basics: how big is it, how many
parts, is it standing in a neutral pose, are there holes, does it have textures.
**Who:** Agent (fully automatic).
**Cost:** Free (Blender, built into the pipeline).
**How:** The agent runs `tools/statue-to-game/mesh_intake_check.py` on your file.
**How you know it worked:** You get a one-page report: size, part count, pose
verdict, texture check. If the statue is striking a pose (dabbing, crouching),
it gets flagged here — auto-riggers need a plain standing pose.

### 2. CLEANUP — "Make it the right size and shape"
**What:** Scale the statue to real-world size (meters), make sure it's standing on
the ground, reduce the triangle count if it's absurdly heavy (Tripo statues are
often 500k+ triangles; games want ~15–30k).
**Who:** Agent (fully automatic, Blender headless).
**Cost:** Free.
**How you know it worked:** The intake script re-run shows the right height and a
sane triangle count. Nothing about how it *looks* changes.

### 3. AUTO-RIG — "Give it a skeleton"
**What:** A statue is one solid lump. A game character needs bones inside it
(hips, spine, arms, legs, head) so it can move. An "auto-rigger" figures out
where the bones go.
**Who:** This is the ONE stage with a manual step — see below.
**Cost:** Free at every option. Pick one:

| Option | Cost | Account needed | How | Agent can do it? |
|---|---|---|---|---|
| **Mixamo auto-rigger** (mixamo.com) | Free | Adobe account (free) | Upload the statue as OBJ/FBX in a T-pose or A-pose, place the chin/wrist/ankle markers where it asks, download the rigged FBX | No — it's a website with no API. Either you or an agent-with-browser does the clicking. **Best quality free option.** |
| **AccuRIG** (Reallusion) | Free | Reallusion account (free) | Desktop app: load mesh, it rigs it | No — desktop app, interactive |
| **Rigify** (inside Blender) | Free, open-source | None | Agent fits Blender's human meta-rig to the statue and generates the rig | **Yes — fully agent-runnable.** Quality varies; good fallback when you don't want to click through a website. |

**What comes back:** A rigged file (bones + mesh). 
**How you know it worked:** The intake script now reports `ALREADY_RIGGED` with a
sane bone count (40+).

### 4. SKINNING — "Glue the skin to the bones"
**What:** "Skin weights" = for every point on the body, which bones move it and
how much. The shoulder point should be 60% upper-arm + 40% chest, not 100% one
bone (that's what causes the webbing/tearing you've seen).
**Who:** Agent (fully automatic — Blender paints the first pass of weights).
**Cost:** Free.
**How you know it worked:** `verify_character.py` gate G3 (weights sum to 1.0).
But auto-weights are NEVER perfect on shoulders — that's what stage 5 is for.

### 5. WEIGHT FIXES — "Fix what the machine got wrong" ⭐ YOUR HANDS (only if flagged)
**What:** The agent raises the character's arms to 15°/30°/45°/60°/90° and measures
stretching. If the shoulders web or tear, it flags the exact bad spots — and
*that's* when you get called in, because fixing weights needs a human eye.
**Who:** YOU, but only on flagged spots, using the guided mode.
**Cost:** Free.
**How:** Open the weight-paint tool (link in your repos under
`tools/weight-paint-pwa/`). Guided mode lights up the bad verts and walks you
through it in plain words: tap the bone, paint the glowing spots, drag the arm
slider to check. No rigging knowledge needed — it points at the problem.
**How you know it worked:** The agent re-runs the arm probes and they pass.
**If the agent's probes pass:** you skip this stage entirely. Most characters will
only need small touch-ups, not full repaints.

### 6. ANIMATION — "Teach it to move"
**What:** Your character needs a walk, idle stance, punches, taunts. Nobody
hand-animates these — we take real motion-capture clips and *retarget* them
(re-map the motion from the mocap skeleton onto your character's bones).
**Who:** Agent (fully automatic).
**Cost:** Free. Clip sources (all verified, see
`tools/statue-to-game/INTEGRATIONS.md`): Mixamo (2000+ free clips, Adobe
account), CMU mocap archive (free, no account — the agent fetches clips with
`tools/statue-to-game/fetch_mocap.py`), Quaternius Universal Animation Library
(CC0), Kenney Animated Characters (CC0), or your own phone video tracked with
PoseTrak (free, open-source) for custom taunts. Retargeting runs through the
free Rokoko Studio Live Blender addon (LGPL-3.0, retarget panel needs no
account or hardware).
**How you know it worked:** The character plays the clip without limbs detaching
or twisting backwards. The agent renders a preview video per clip.

### 7. EXPORT — "Pack it for the game"
**What:** Save the final character as a `.glb` file with the exact settings the
game engine (three.js) needs.
**Who:** Agent (fully automatic).
**Cost:** Free.
**How you know it worked:** The file loads in the game with bones, weights, and
textures intact.

### 8. VERIFICATION — "Prove it's game-ready"
**What:** The agent runs the full gate suite and hands you a PASS/FAIL report card.
**Who:** Agent (fully automatic).
**Cost:** Free.
**How:** `tools/statue-to-game/verify_character.py` — 7 gates:

| Gate | What it checks | Pass bar |
|---|---|---|
| G1 Structure | File loads with mesh + skeleton | ≥1 mesh, ≥1 armature |
| G2 Rig | Skeleton is complete | ≥20 bones, hips/spine/head/arms/legs present |
| G3 Weights | Skin weights are valid | Every point's weights sum to 1.0 |
| G4 Arm probes | Shoulders don't web/tear | Arms raised 15→90° forward + sideways, worst triangle stretch < 3x at every angle |
| G5 Stray geometry | No exploded bits | Nothing floating far below the feet |
| G6 Scale | Real-world size | 1.4–2.2 m tall |
| G7 Textures | It has a painted surface | Image textures found (warning only) |

**How you know it worked:** `VERIFY PASSED`, 7/7. Anything that fails names the
exact problem and which stage to redo.

### 9. APPROVAL — "Your eyes, final say" ⭐ YOUR HANDS
**What:** The agent shows you the report card + a turntable render + one animation
preview. You approve or kick it back with notes.
**Who:** YOU. Nothing ships without this.

---

## The whole flow, one picture

```
You drop a Tripo statue in
        ↓
Agent: intake → cleanup → rig → skin → probe → animate → export → verify
        ↓                                              ↓
   All gates pass? ──YES──→ Agent shows you the proof → YOU approve → game-ready
        ↓
       NO (shoulders web, etc.)
        ↓
   Agent flags the exact bad spots
        ↓
   YOU paint only those spots (guided mode, plain words)
        ↓
   Agent re-verifies → YOU approve → game-ready
```

**Your total manual work:** paint the flagged spots (if any), approve the result.
Everything else is machines.

---

## Tool locations

- This doc: `tools/statue-to-game/PIPELINE.md`
- Agent runbook (the step-by-step workers follow): `tools/statue-to-game/AGENTS.md`
- Intake checker: `tools/statue-to-game/mesh_intake_check.py`
- Verifier: `tools/statue-to-game/verify_character.py`
- Free integrations (verified 2026-10-09 — mocap, trackers, CC0 asset sources):
  `tools/statue-to-game/INTEGRATIONS.md`
- CMU clip fetcher: `tools/statue-to-game/fetch_mocap.py`
- Weight-paint tool (your hands): `tools/weight-paint-pwa/` (+ phone link)
- Shoulder probe renders: `tools/rig-repair/probe_shoulders.py`
- Background research: `docs/AI_RIGGING_RESEARCH.md`
