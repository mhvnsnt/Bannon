# MDickie-base attire layer

The owner wants MDickie's (Wrestling Empire) base bodies/parts — which are a step above our procedural
body — available as an extra ATTIRE LAYER for the whole roster, mapped by archetype/real-wrestler
inspiration. It sits between a character's real attires and the "Retro (Procedural)" fallback:

    Default (AAA GLB) -> [character alts] -> MDickie Base -> Retro (Procedural)

## Why the meshes aren't in the repo (and what to drop)
MDickie ships **no per-character 3D models** — every wrestler is a shared low-poly base body reskinned
at runtime from parameters. We only ever ingested the `.bb` **code** (moves/AI/career → `tools/bbparse/`),
never art. So the base bodies have to be provided as files. Drop a small set of shared base GLBs here:

    assets/models/mdickie_bases/MONSTER.glb          # big-man / Kane-type
    assets/models/mdickie_bases/POWERHOUSE.glb       # muscular
    assets/models/mdickie_bases/TECHNICIAN.glb       # lean athletic
    assets/models/mdickie_bases/BRAWLER.glb          # average build
    assets/models/mdickie_bases/CRUISER.glb          # small / high-flyer
    assets/models/mdickie_bases/LUCHADOR.glb         # masked cruiser
    assets/models/mdickie_bases/SUIT.glb             # dressed / manager
    assets/models/mdickie_bases/FEMALE.glb
    assets/models/mdickie_bases/FEMALE_ATHLETIC.glb

They should be rigged to the Mixamo BONE_MAP like the other fighters (run them through
`tools/unirig/batch_rerig.py` if they aren't skinned). Ideally texture-swappable so one base serves
many characters via palette; a plain textured base is fine to start.

## How the mapping works (already wired in BANNON_v150.html)
- `window.MDICKIE_MAP` — named overrides (VAIN_ABEL->MONSTER [Kane], JUDAS_MESSIAH->TECHNICIAN
  [Jericho], EL_TORO_DE_ORO->POWERHOUSE [Batista], etc.).
- `mdickieBaseFor(name)` — falls back to archetype+gender when a character isn't named, so EVERY
  fighter (including original, non-real-wrestler characters) resolves to a base.
- Selecting the **"MDickie Base"** attire sets `f._mdickieBase`; `applyCharModels()` loads the mapped
  base GLB. If the file is absent, it degrades to the procedural body (no broken load) — so the option
  is safe to ship before the assets land.

## Open-source alternative
If you'd rather not extract Wrestling Empire's assets, any set of low-poly rigged humanoid bases
(one per silhouette above) drops in the same way — the layer doesn't care where the meshes came from.
