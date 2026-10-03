# The Ontology Skill Tree — Tree of Life progression (God Within)

Skyrim-style RPG depth overwriting standard wrestling progression. You evolve through the **ten sephirot**
of the esoteric Tree of Life, not flat stat levels. Accessed by pressing the touchpad: the game does NOT
pause — Bannon drops to one knee in the physical environment and the AR tree projects into the room; **you
are vulnerable to attack while allocating points.** (World runs on numerology/astrology as a literal
personality OS — this tree is the player-facing evolution layer of that.)

## Nodes (as specified; expand toward the full 10 sephirot)
- **Malkuth — The Foundation** (physical base / raw VPW durability)
  - *Concrete Bone Density* — resist environmental MDickie damage (thrown through tables/windows).
  - *Heavy Stance* — light strikes no longer interrupt your grapple animations.
- **Geburah — Severity & Feral Combat** (the **Maime** branch — aggression, Tekken-5 Devil-Within juggles, momentum)
  - *Uncaged Strikin'* — standard punches → unprotected elbows, instant bleed.
  - *Environmental Execution* — heavy finishers directly onto concrete / exposed steel turnbuckles.
- **Chesed — Mercy & Architectural Control** (the **Marquis** branch — precision counters, de-escalation)
  - *Surgical Parry* — micro-window perfect deflect of weapon strikes + instant disarm.
  - *Grounded Submission Master* — faster joint locks; submit safely without permanent injury.
- **Da'at — The Hidden Knowledge** (autonomous center; Shinobi/Stick-Up hide these unlock codes in the environment)
  - *Codebreaker* — auto-decrypt the pathways Kennedy locks down.
  - *System Purge* — burn out Combs's stamina-drain bloatware by sacrificing some of your own HP to clear the cache.
- **Kether — The Crown** (apex; locked until the final campaign tiers)
  - *The God Within* — you no longer fight the physics engine, you DICTATE it: grab static (glitched) entities
    and permanently rewrite their code back to human form WITHOUT draining their HP first.

## Mapping to the engine
The three persona branches (Geburah=Maime, Chesed=Marquis, and the mask/resilience path toward Bannon) line up
1:1 with the persona state machine in `native/include/bannon_persona.h`. Malkuth durability = the ragdoll/
`WrestlerState` toughness constants; Kether "dictate the physics" = the authored-override layer over the solver.
Remaining sephirot (Tiferet, Netzach, Hod, Yesod, Binah, Chokmah) are open for design — keep the branch→persona/
stat mapping consistent so allocations resolve to real physics multipliers, not cosmetic numbers.
