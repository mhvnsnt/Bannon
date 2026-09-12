# GOD WITHIN — New Game Plus story mode (design canon)

Distilled from the owner's design transcripts (ontology_core / models_info / godwithinmode). Devil-Within-
style, canon-adjacent: replays Book 3 Ch.31–40's shape with one swap — **Onyx** (game-only, not in the
books) does the cultivating, *shaping* Maime rather than recruiting him. Genre = match-based story (not a
walking beat-em-up), so it runs on the existing physics engine, not a new exploration engine.

Influences (baked): Skyrim RPG depth × MDickie sandbox × WWE 2K26 × Steve Masson *Neckbreaker*/Visceral
Pro × Tekken 5 Devil Within. VPW = the physics engine (Visceral Pro Wrestling-tier active ragdoll).

## The three fightable persona states  (→ implemented in `native/include/bannon_persona.h`)
One man, a **state-machine swap on physics multipliers** — NOT three characters. Book 5 already made Maime
a distinct feral combat mode ("bypassing the skill tree", `[SYSTEM ERROR: TRAUMA DETECTED]`).
- **Marquis** (unmasked baseline) — Technician/Strategist/Underdog. Lower damage, NO stagger resistance
  (human), but the best counter/reversal windows and reads. Highest skill ceiling, lowest floor.
- **Bannon** (the mask) — Powerhouse/Unstoppable. High stagger resistance (dial down hitstun response),
  slower, every connect counts — the resilience state.
- **Maime** (the paint) — Feral/Unstable/Sadistic. Highest raw damage + evasion variance, but movement is
  erratic ON PURPOSE (jitter into dash trajectories), fewer telegraph tells on his own attacks (he doesn't
  know what he's about to do either), max impact velocity on connect.

## God Mode OS — neuralink overlay (the mode's "Dex")
Live neuralink UI rendered over the VPW physics (not a pause menu). Tekken-5-Devil-Within radar map, tracks
MDickie weapon degradation, measures a **Corruption vs Purity** threshold in real time. Only a few entities
know it's running: Bannon/Marquis/Maime, Onyx, Zero Point, and secretly the "God Within" variants of Trap
Shinobi, Stick-Up, Combs, Kennedy. Front office has a backdoor: Combs uploads bloatware to drain stamina;
Kennedy encrypts the radar to blind corridors; Shinobi/Stick-Up leave decrypted skill points in the sandbox
(smash the right vending machine / electrical box).

## Act structure
- **Act 2 — The Lower Levels (Interception):** cut Onyx's supply lines. Walk Tyneshia+Cody through the
  hospitality suite; you fight the ROOM (static solidifying into a feral gimmick), not Curtis Bowe. Action
  branches (Command / Purity / Anchor) can DELETE a boss fight by reaching it first.
- **Act 3 — The VIP Skybox (Confrontation):** not a match — a battle for engine render priority. Tyneshia
  forces Onyx to render solid, strips her authority; Onyx dissolves into raw code (can't exist where
  Tyneshia has full control).
- **Act 3.5 — The Lockdown (Queen Ascendant) = NEW GAME PLUS start:** timeline pushes forward, not rewind.
  Play as **Tyneshia** (point guard) escorting a burned-out, empty-health Bannon (VIP escort mission) out of
  Combs's corporate lockdown; enemies are riot-shield tactical security, not wrestlers. Command prompt directs
  autonomous allies.

## Tweener payoff
Tyneshia's canon "PURIFY THE ACT" line only PARTIALLY lands (partial meter reset, not full) — Onyx gave Maime
a *reason*, not just permission. Maime stabilizes as a coexisting THIRD state (anti-hero), not weapon, not
winner. Onyx's first direct appearance renders **only while the Maime state is active** — the render hook and
the "unseen" narrative conceit are the same system.

See `ontology_skill_tree.md` (Tree-of-Life progression) and `noncanon_roster.md` (Onyx + CIPHER/ECHO/HOLLOW/
STATIC). Character identities confirmed from the 20 Tripo concept images in `../../assets/models/CANON_MODELS.md`.
