# SOURCE REGISTRY — provenance for every third-party asset in this repo
**Rule (fail-closed):** no third-party file lands in this repo without a row in this table FIRST.
The intake scripts refuse files whose license cannot be verified. QUARANTINED sources never import.

**License key:** CLEAN = importable · QUARANTINED = never import · NEEDS-CHECK = flagged, not silently merged

| # | Asset(s) | Source | License | Source URL / proof | Imported to | Date | Imported by |
|---|---|---|---|---|---|---|---|
| 1 | KayKit crowd characters (9 GLBs: Knight, Rogue, Rogue_Hooded, Barbarian, Mage, Skeleton_Warrior, Skeleton_Rogue, Skeleton_Mage, Skeleton_Minion) — animations stripped to Idle/Cheer/Unarmed_Idle at import | AshLane `public/models/kaykit/` (vendored) | **CLEAN** — CC0 1.0 Universal | https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0 and https://github.com/KayKit-Game-Assets/KayKit-Dungeon-Remastered-1.0 — NOTICE.txt vendored at `assets/models/crowd/KAYKIT_LICENSE.txt` | `assets/models/crowd/` | 2026-10-05 | Muse (convergence import #1) |
| 2 | KayKit arena props (23 GLBs: walls, wall_arched, wall_corner, wall_gated, pillars, columns, torches, torch_mounted, banners ×2, stairs ×2, floor tiles ×2, barrels ×3, boxes ×2, barrier, tables ×2, stool) | AshLane `public/models/kaykit/props/` (vendored) | **CLEAN** — CC0 1.0 Universal | https://github.com/KayKit-Game-Assets/KayKit-Dungeon-Remastered-1.0 — NOTICE.txt vendored at `assets/models/arena_props/KAYKIT_LICENSE.txt` | `assets/models/arena_props/` | 2026-10-05 | Muse (convergence import #2) |
| 3 | jsfxr synthesized-SFX engine (vendored: `sfxr.cjs`, `riffwave.cjs`, `sfxr.mjs`, `riffwave.mjs`, `sfxr-to-wav`) + our preset CLI `render_sfx.cjs` (8 wrestling presets) + README | https://github.com/chr15m/jsfxr | **CLEAN** — The Unlicense (public domain) | Source repo UNLICENSE, vendored at `tools/audio/jsfxr/UNLICENSE` — verified 2026-10-05 | `tools/audio/jsfxr/` | 2026-10-05 | Muse (harvest import #1) |
| 4 | Kenney Impact Sounds — 20 curated OGGs (ring bell, punch heavy/medium, generic light/medium/heavy, metal heavy/medium, wood heavy/medium) | https://kenney.nl/assets/impact-sounds (direct download) | **CLEAN** — CC0 1.0 Universal | Pack License.txt, vendored at `assets/audio/sfx/kenney/KENNEY_LICENSE.txt` — verified 2026-10-05 | `assets/audio/sfx/kenney/` | 2026-10-05 | Muse (harvest import #2) |

## Quarantined (never import)
| Source | Why |
|---|---|
| `wwe2k22_*` GLBs | Exact commercial rips — reskin policy; reskin doesn't clear provenance |
| Moneymachine swarm outputs | Verified faked "finds" |
| Schwarzerblitz game art/stages/music | Upstream BSD-3 notice excludes game assets |
| Hunyuan3D 2.x weights | Tencent community license excludes EU/UK/SK + commercial terms — flagged 2026-10-05, not vendored |
| OpenCap Monocular | PolyForm Noncommercial 1.0 — not commercial-safe, flagged 2026-10-05 |
| Stable Fast 3D / SPAR3D | Stability community license, revenue cap — flagged 2026-10-05, not vendored |
