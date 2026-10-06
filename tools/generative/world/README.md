# world/ — procedural arena + crowd

- `arena_generator.py` — full venue → GLB: ring (canvas/apron/posts/sagging
  ropes/turnbuckles/steps), barricade, entrance ramp, titantron + side screens,
  light rig with spotlights, 4 tiered stands. `--company` picks a palette;
  `--schematic` writes a labeled top-view SVG.
- `ring_variants.py` — palette schema + 6 company slots. **Owner palettes still
  pending** — slots are marked placeholders; no canon names/colors invented.
- `crowd_generator.py` — varied humanoids (build, skin tone, clothing, hair —
  NOT chibi, per owner directive) as rigid node hierarchies in the stands, with
  CROWD_CHEER / CROWD_BOO / CROWD_WAVE (mexican wave) clips. `--count` fans,
  `--seed` for reproducibility.
