# MDickie characters → BANNON roster (attire bases) — standing directive

Owner directive (don't re-ask): MDickie's game characters get wired into OUR roster as **attire
bases** for the appropriate proprietary/book character, then progressively morphed away from his look.
NEVER ship real-wrestler names — map the parody/archetype to OUR canon and rename.

## Now unblocked (2026-07-20)
The WR3D `.zf3d` **assembly is fixed** — `decode_zf3d.mjs` composes the nested skeleton hierarchy, so
character models assemble into coherent bodies (were scattered). Pipeline per attire:
1. `node tools/mdickie_scraper/decode_zf3d.mjs <build0X.zf3d>|<char.zf3d> out.glb` → assembled body.
2. Apply the WR3D body-texture template (shared skin/attire texture — extract from the game's costume
   texture atlas; TODO) so it's not untextured white.
3. Rig via UniRig (`batch_rerig.py`) so it animates as a fighter (currently a static bind-pose statue).
4. Bank to `assets/models/attire/mdickie/<CHAR>_<attire>.glb`, register as a CHAR_ALTS attire on the
   mapped character (NOT a new character), and morph toward the owner's design over time.

## Archetype → BANNON character map (from CLAUDE.md + books; extend as owner names them)
- Kane-type (masked monster)      → **Vain Abel**
- Chris Jericho-type              → **Judas Messiah**
- Batista-type (power enforcer)   → **El Toro de Oro**
- Super Dragon-type (masked stiff)→ **Hollow**
- Enzo Amore-type (loudmouth)     → **Static**
- Lio Rush/Blackheart-type        → **Cipher**
- Shotzi-type (goth punk)         → **Echo**
- HBK/Showstopper-type            → **Hall Nighter**
- nWo/hostile-takeover boss       → (NWC faction leaders)
- When unsure which BANNON char a MDickie wrestler maps to → leave for the owner; do NOT guess a real name.

## Notes
- WR3D costume models are `assets/costumes/models/build01..09.zf3d` (generic base bodies). Named-wrestler
  attire/appearance lives in the game's ROSTER/save data (which body + which texture region colors), not
  the model files — so a full "his Kane → Vain Abel" needs the roster/save parse too (queued).
- MDickie himself is already a playable character (MDICKIE); his assembled body shows on his portrait card
  via CHAR_PORTRAIT_MODEL; his in-match fighter is procedural until rigged.
- Priority: LOW (owner). Do it in batches when the higher-priority bricks (Universe flow) are done.
