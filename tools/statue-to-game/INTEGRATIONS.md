# Free Integrations for the Statue-to-Game Pipeline

Every tool below was **fetched and checked on 2026-10-09** before being
documented here. Nothing in this file is assumed or invented. Cost is $0 for
all of them. If a claim here ever goes stale, re-verify the linked page
before relying on it.

Quick map:

| Integration | Pipeline stage | What it gives us |
|---|---|---|
| CMU BVH mocap mirror | 6 ANIMATION | Free motion clips (walks, fights, taunts) |
| PoseTrak | 6 ANIMATION | Custom taunts from video you film yourself |
| Rokoko Studio Live (Blender addon) | 6 ANIMATION | Retarget presets: maps any clip onto our rigs |
| Quaternius | 6 ANIMATION / 2 CLEANUP | CC0 animated characters + animation library |
| Kenney | 2 CLEANUP / props | CC0 asset packs (no account) |

---

## 1. CMU mocap BVH database (GitHub mirror)

- **URL:** https://github.com/una-dinosauria/cmu-mocap
- **What it is (plain words):** The Carnegie-Mellon motion-capture database —
  thousands of real human motion clips (walking, running, punches, kicks,
  dances, sports) — converted to BVH format by Bruce Hahne so any 3D program
  can read them. 113 subjects, each with multiple clips.
- **Cost:** $0. No account needed.
- **License:** CMU places **no restrictions** on the original dataset, and the
  BVH converter places no additional restrictions on the conversion. Free for
  research **and commercial** use. (From `READMEFIRST.txt` in the repo:
  "Use this data! This data is free for use in research and commercial
  projects worldwide." Published results should credit CMU.)
- **How the agent uses it (STAGE 6 ANIMATION):**
  1. `python3 tools/statue-to-game/fetch_mocap.py --list --subject 001`
     lists the clips in a subject.
  2. `python3 tools/statue-to-game/fetch_mocap.py --sample --out assets/models/mocap/`
     downloads the default walk sample (subject 001, clip `01_01.bvh`)
     and runs a BVH structure check (HIERARCHY + MOTION sections,
     joint/frame counts sane).
  3. Import the BVH into Blender headless, retarget (see Rokoko addon below
     or the constraint-bake method in the AGENTS.md runbook), bake, render
     preview.
- **Verification status:** verified live 2026-10-09 — repo page fetched
  (public, 113 data subjects listed via GitHub API), `READMEFIRST.txt`
  license read, sample clip `01_01.bvh` (2.1 MB) downloaded and BVH check
  PASSed (31 joints, 2752 frames @ 120fps). `fetch_mocap.py` runs clean.

## 2. PoseTrak

- **URL:** https://github.com/hkaimio/posetrak
- **What it is (plain words):** An open-source motion-capture tracker that
  turns ordinary video into skeletal animation, using a math technique
  (Unscented Kalman Filter) to track joints frame by frame. Supports one or
  more cameras — including a phone camera — and fisheye/wide-angle lenses.
- **Cost:** $0. No account needed.
- **License:** Apache License 2.0 (confirmed on the repo page; project is
  REUSE-compliant).
- **How the agent uses it (STAGE 6 ANIMATION — custom taunts):**
  This is the custom-taunt input. When the owner wants a taunt nobody has a
  clip for (finger guns, crucifix, dread whip), he films himself doing it on
  a phone. The agent runs PoseTrak (`posetrak track config.toml`) on the
  footage, takes the tracked skeleton, and retargets it onto the character
  rig in Blender. No paid suit, no studio.
- **Honest caveats:** there is no packaged release yet — using it means
  building from source (Linux/Windows setup guide in `docs/setup.md`). It is
  a tracker, not a one-click exporter: check the export options in the docs
  at setup time and confirm the output feeds the retarget step before
  planning a run around it.
- **Verification status:** verified live 2026-10-09 — GitHub page fetched,
  license Apache-2.0 confirmed, multi-camera video tracking confirmed in
  README. Not yet wired end-to-end in our pipeline (no owner footage has
  been run through it).

## 3. Rokoko Studio Live for Blender

- **URL:** https://github.com/Rokoko/rokoko-studio-live-blender
- **What it is (plain words):** An official Blender addon that streams motion
  capture into Blender and — the part we care about — **retargets animation
  between different skeletons**: pick a source armature (a CMU BVH import, a
  PoseTrak track), pick our character's armature, hit "Build Bone List" and
  "Retarget Animation", and the motion transfers over with bone auto-mapping.
- **Cost:** $0 for the addon. No account needed to use the retarget panel.
- **License:** GNU LGPL-3.0 (confirmed on the repo page).
- **Blender compatibility:** requires Blender 2.80 or higher — our headless
  Blender 4.0.2 is covered.
- **How the agent uses it (STAGE 6 ANIMATION):**
  Install the addon into the headless Blender 4.0.2, import a clip
  (CMU BVH / PoseTrak track / Quaternius anim), run the retarget panel's
  bone-list + auto-detect + Retarget Animation flow in a bpy script, bake the
  result. This replaces hand-built bone maps for clips where the skeleton
  doesn't match ours 1:1. Retarget presets can be saved and reused across
  characters with the same rig.
- **Honest caveats:** the *live streaming* half of the addon talks to the
  Rokoko Studio app — the addon is free, but live capture needs a motion
  source (their suit hardware is paid). The **retarget panel works fully
  offline in Blender** with no Studio, no account, no hardware. Document here
  only the retarget path, which is the free one.
- **Verification status:** verified live 2026-10-09 — GitHub page fetched,
  LGPL-3.0 confirmed, requirements table (Blender 2.80+) and the Retargeting
  section (Build Bone List → Retarget Animation) read. Not yet installed in
  our Blender 4.0.2 — that wire-up is open work.

## 4. Quaternius

- **URL:** https://quaternius.com
- **What it is (plain words):** A one-artist library of low-poly 3D game kits
  — characters, animals, weapons, environments — drawn in a simple flat style.
  Built for game developers, downloads as FBX/OBJ/glTF.
- **Cost:** $0 for the Standard downloads. No account needed. (There is a
  paid "Source" tier that adds engine projects + Blend files — still CC0,
  but the pipeline never needs it.)
- **License:** CC0 (public domain) — stated on each pack's page, e.g.
  "Free to use in personal, educational and commercial projects." No
  attribution required (crediting is appreciated).
- **How the agent uses it (STAGE 6 ANIMATION / reference):**
  Two pipeline-relevant packs:
  - **Universal Animation Library (+ v2):** a retargetable humanoid animation
    library — an alternative clip source to Mixamo/CMU for walks, idles,
    attacks.
  - **Universal Base Characters / Animated Men / Animated Woman packs:**
    rigged, retargetable humanoids — useful as retarget reference skeletons
    and as proportion checks when our statue proportions look off.
  Download the pack zip, unzip, import the glTF into Blender headless, and it
  enters the same retarget flow as any other clip.
- **Verification status:** verified live 2026-10-09 — site fetched (pack
  index live), CC0 confirmed via per-pack license statements (third-party
  catalog spot-checked a pack page 2026-08-25: license "CC0", "Free to use
  in personal, educational and commercial projects"). Not yet downloaded in
  our pipeline.

## 5. Kenney

- **URL:** https://kenney.nl (assets at https://kenney.nl/assets)
- **What it is (plain words):** Kenney's long-running library of free game
  assets — 3D models, 2D sprites, UI, audio — made for indie developers.
  Downloads are plain zip files.
- **Cost:** $0. No account needed. (There is a paid "Kenney Club" for early
  access/goodies — the public packs are free and that's all we use.)
- **License:** CC0 (public domain) for the asset packs. Download, use in
  commercial projects, no attribution required.
- **How the agent uses it (STAGE 2 CLEANUP / game dressing):**
  Pipeline-relevant: the **Animated Characters** pack (CC0 animated humanoids,
  GLB included) as clip sources and reference, plus environment/prop packs
  for arena dressing (ring skirts, barricades, crowd props). Same flow:
  download zip → import glTF → retarget clips or use props as-is.
- **Verification status:** verified live 2026-10-09 — site fetched (home +
  asset library live). CC0 confirmed for the packs via multiple independent
  asset-license ledgers (whole catalog documented as CC0). Not yet
  downloaded in our pipeline.

---

## Standing rules for adding new integrations

1. Verify before documenting: fetch the repo/site, confirm it exists, confirm
   the license, confirm the cost is $0. Unverified = not in this file.
2. Note honest caveats (no packaged release, needs Studio app, paid tier
   exists but we don't need it). The owner catches invented capabilities.
3. Name the exact pipeline stage it feeds and the exact command/script the
   agent runs — no vague "can be used for" entries.
4. Stamp the verification date and what was actually checked.
