# GOD WITHIN — Roam Mode (build plan)

The wrestling-RPG roam mode: a MDickie **Super City / Hard Time 3D / School Days 3D** lineage crossed
with a Skyrim-style open world, in the BANNON universe. Base logic comes from the Wrestling MPire
files (World.bb roam/camera, Meetings.bb encounters, Promos.bb dialogue, Career.bb progression).

## Shipped (spine)
- `window.BANNON_GODWITHIN` — `start()` drops you into the world (arena hub) as your persona with a
  roster rival present; free 8-way roaming (engine already supports all-direction movement).
- Proximity interaction: walk up to any character → prompt with **TALK** (promo + relationship shift via
  BANNON_PROMOS / BANNON_STORY) / **CHALLENGE** (a real physics match — the fighter is already live) /
  **LEAVE**.
- Entry from the main-menu **PLAY** submenu → GOD WITHIN.

## Next (build order)
1. **Open hub map** — replace the single arena with a walkable space (locker room → arena → parking lot
   → street), MDickie block-load style; camera follows the player (needs the follow-cam `camType`).
2. **Populated world** — spawn multiple NPCs from the roster around the map, each with schedule/attitude
   (BANNON_MDICKIE.intensity / isIsolated already drive AI focus).
3. **Daemon core** — the God-Within persona system (mask on/off, Maime breaking through) as the RPG
   spine: quests, allegiance, turns escalate the daemon (GOD_WITHIN module already swaps persona mid-match).
4. **Backstage as space** (Meetings.bb) — walkable locker room/office; interactions become rooms not menus.
5. **Persistence** — roam progress saved via BANNON_UNIVERSE/CAREER save (already localStorage-backed).
6. **Follow-cam `camType`** — selectable camera modes (hard-cam / follow-behind / MDickie roam) for roam.
