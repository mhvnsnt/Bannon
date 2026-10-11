# Character Brief — template for the Forge

Fill one copy of this file per character and hand it to the forge:
`python tools/forge/generate.py --brief tools/forge/briefs/MYCHAR.md --out assets/models/MYCHAR.glb`
(or describe it in chat — the agent fills this in for you).

**RULES (owner law, do not skip):**
- Original characters only, or canon characters from the books. NEVER describe a
  real wrestler's likeness — the forge builds originals; rips get reskinned, not regenerated.
- No trademarked logos, brand names, or promotion marks in attire.
- The reference pose is always a front-facing symmetrical A-pose on a plain
  background (the forge adds this automatically; don't describe camera angles).

---

## Identity
- **Name (display):** REPLACE — e.g. "Brutus Clay"
- **charKey:** REPLACE — e.g. `FORGE_TEST_DUMMY` (UPPER_SNAKE, must not collide with an existing roster key)
- **Canon status:** REPLACE — original test character / canon (book + chapter) / game-only fighter

## Build
- **Height:** REPLACE — e.g. 6'2"
- **Weight:** REPLACE — e.g. 245 lb
- **Body type:** REPLACE — e.g. heavyweight powerlifter, thick torso, short legs
- **Ethnicity / skin:** REPLACE — e.g. Black (deep brown skin). Race/ethnicity is identity — be specific.

## Attire (coherent pro-wrestling gear ONLY — no nonsensical straps/gear)
- **Trunks/tights:** REPLACE — e.g. plain solid black trunks, no designs
- **Boots:** REPLACE — e.g. black lace-up boots to mid-shin
- **Gloves/pads:** REPLACE — e.g. black MMA gloves, white wrist tape
- **Hair:** REPLACE — e.g. shaved head, short black beard
- **Face/body paint or tattoos:** REPLACE — e.g. none (or describe exactly)
- **Colors:** REPLACE — e.g. black + white, no logos

## Style reference (optional)
- **Reference image:** REPLACE — path to a front A-pose image, or leave blank and the
  forge's image step generates one from this brief. If you supply `--image`, that wins.
- **Vibe:** REPLACE — e.g. "quiet brawler, MDickie-style indie wrestler"

## Negative (things that must NOT appear)
REPLACE — e.g. suspenders, singlet straps, logos, text, watermark, cartoon style, superhero costume

## Notes
REPLACE — anything else (entrance music, finisher, hometown billing — informational only,
not used by the 3D model).
