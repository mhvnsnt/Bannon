# BANNON / Brutal Fist Production Dev Log — 2026-09-28

## Animation pipeline — current production requirement

Every new animation must enter one universal path regardless of source skeleton, bone count, rest pose, root-motion convention, receiver/attacker role, back-turned state, or whole-body rotation.

**Required chain**

source provenance/license → skeleton inspection → canonical bone aliases → source-rest to target-bind conversion → explicit rest tracks for missing target joints → root/facing/floor normalization → body-count + receiver detection → semantic classification → joint/limb/contact gates → combat timing → model-specific runtime visual certification → promotion into a fighter moveset.

`UNKNOWN` is never PASS. Static safety is not visual certification.

### Why clips differ

- bone naming/count differences;
- A-pose versus T-pose/rest-pose differences;
- missing tracks inheriting a previous animation pose;
- receiver halves accidentally used as attacker moves;
- multi-body/tag recordings collapsed onto one fighter;
- attacks that turn or rotate the fighter during the action;
- root-motion versus in-place variants;
- frozen/statue clips;
- upside-down/floor-contact clips misclassified as standing;
- strike direction inferred from peak speed instead of actual reach;
- long demonstration clips used as one combat action.

### Hurricane Kick

HURRICANE_KICK is currently rejected by the measured bake rather than hidden as a working move. Its current bake is 1.8333s, airborne, and its strike geometry is unsafe; prior audit identified hips-dominated one-bone rotation.

**Next implementation rule:** spinning attacks get a dedicated rotation-aware special-move contract that preserves certified whole-body yaw/rotation, separates root displacement from local motion, and verifies facing/contact at impact. Do not simply restore the old broken clip.

## Arena / stage canon and measured specs

### Ring

Native arena modes: RING_4, RING_6, OPEN.

Measured/default ring: native half-extent 3.0 m; Unreal ring half-extent 350 cm (~7 m diameter); top rope 1.2 m / 120 cm; restitution 0.35.

Open/God Within stage: half-extent 30 m / 3000 cm; soft outer wall; free traversal inside.

Ring themes documented in Unreal:
- Fire: floor #2a1a14, accent #ff4500, deck #26262e, chrome post #888894, mat #2c2420
- Cold: floor #223344, accent #00bbff, mat #1e2830
- Void: floor #111122, accent #9966ff, mat #0c0a18

Documented free-roam environments: BACKSTAGE, PARKING, CITY, GYM, Supermax Block, Metro General, Popcorn Hotel, Promoter Desk, Neon Strip.

God Within encounter locations documented in code: Loading Dock (Ronin), Dumpster Corridor (Zephyr), Boiler Room (Golem).

Story locations documented in the books: Neon Olympus, S.S. Salvation Docks, the Temple/Boyle Heights ruins, hospitality suite, VIP Skybox, and corporate lockdown.

These names/specs are canon/design records; they are not all verified as fully playable stages in the current PWA.

## Canon / story

- God Within: New Game Plus, canon-adjacent game mode shaped after Book 3 Ch.31–40; Onyx is explicitly game-only and cultivates/shapes Maime.
- Marquis / Bannon / Maime: documented as three fightable persona states of one man.
- Book 5 / Neon Olympus: Shinobi/Jaleel's AR-controlled Island, Resistance/Core Unlocked, The Crash War Games, EMP and Warlord Era, then The Administration.
- Book 6: continues Books 3–5 as binding canon; adds the Mayan Title Belt, Temple/Boyle Heights ruins, NWC, Outsiders, Cabinet, D-Generation Sex, Coven and New Breed/Algorithm.
- God Within game-only stable: Onyx, CIPHER, ECHO, HOLLOW, STATIC. The repository explicitly separates this group from the six-book canon.

## Roster/model expansion

The owner will create additional models so the book-canon roster can grow.

Confirmed model-manifest identities include BANNON, MAIME, ONYX, CAIN ELIAS, STICK-UP, CIPHER, ECHO, HALL NIGHTER, STATIC and documented alternates.

The extended book roster still contains many identities without a corresponding entry in assets/models/CANON_MODELS.md, including Tyneshia/Karma, Finxsse, Trap Shinobi, Jager, Chief Red Cloud, Lion of Punjab, Lady Rhiannon, Agent Canuck, Celtic Fury, Edwin John Kennedy, Stan Combs, Ronald Slump, Donald Slump Jr., Sam Kennedy, Melissa Kennedy, Triple X, The Dogg, Ass-Man Billy, X-Kid, Kray-Z, Ronye, Krusha P, Mars, Saturn, The Vandal, Vato, Big Cash, Aaron Reiner, Toxin, Judas Messiah, Lil Bill, Vain Abel, Masato Iida, Hikaru Arashi, Kenji Saito, Kiko Tanaka, Ryuji Tatsu, The Finance Demon, The Shaolin Shadow, The Ghost of Lahore, Astrid, Machine Tiger, Pablo, Jean, Vincent, Salvador, Magdalena, Vincent Jean, The Saint, Locomotive, The Exam, Big LG, Gunner, The Phenom, Grave, Jett Gnarly, Mokk Gnarly, Razor, Crux, Luna, Rey Fuego, El Toro de Oro, Sombra Negra, El Jefe, The Sacrifice, John Ford, The Boulder, Agent Smith, La Flame, Lucious, Tiffany Star, Devon Trust, Chainlink, Mr. Zero Point, Gorgon, Jack Slade, Drake Vane and The Algorithm.

## Open-source animation lane

Quaternius Universal Animation Library 1 and 2 are the current CC0/open-source intake targets. The Brutal Fist repository already contains baked UAL1/UAL2 outputs plus a fetch/sync lane.

The official UAL1 release documents 120+ universal-humanoid animations; UAL2 documents 130+ and expands melee/armed combos, parkour and locomotion. Both are CC0. The pipeline must keep standard/free distributions distinct from paid/proprietary source packages.

## PWA blocker recorded from CI

Run 36459115946 passed typecheck, tests, compatibility build, production build, Rocket production build, Chromium install and PWA startup.

The real portrait playtest then failed with: arena ready NO; skinned rigs 0; page errors 144; failed requests 40; attacks started 6 from 6 presses; render rate about 2.3 fps; frames over 120ms: 56.

Missing requests included root /motion/TPOSE.json, /motion/SPINJUMP*.json and many UAL1 source-name JSON paths while corresponding baked UAL files exist under public/motion/baked.

**Production priority:** stop loading the entire 455-clip bank synchronously during fighter startup, fix missing-source/baked-path routing, get two rigs to arena-ready before background animation expansion, then re-run the real portrait combat playtest.
