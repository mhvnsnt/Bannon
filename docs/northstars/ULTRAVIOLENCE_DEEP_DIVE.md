# ULTRAVIOLENCE PRO WRESTLING — Deep Dive

Research date: 2026-10-05. All mechanics summarized in our own words; sources cited.
Outreach status: owner reached out to the creators offering help finishing the game — **no response as of 2026-10-05**. We build BANNON toward this design DNA as our own game in our own universe, regardless.

**Do not confuse with "Ultra Pro Wrestling"** (Sam Vallely / Hyperfocus Games, the WWF No Mercy successor with its own troubled history). Different game, different dev, different project. Everything below is Gackdaw's deathmatch game.

## The developer
- **Gackdaw** ("Adam" per standing doc), solo developer. X: @Gackdaw, @UVWPRO.
- ~14 years in the games industry; was on the development team for the **Arkham games** (Rocksteady's Batman series). His exact role/title is UNVERIFIED from public sources — but the lineage matters: Arkham's freeflow combat (rhythm strikes, counters, chained takedowns, crowd-control flow) is the design literacy behind this game's combat feel.
- Status: unreleased, suspended indefinitely (per standing doc: lacked a team). No publisher, and he has said he does not want crowdfunding (Fightful).

## Sources
- Fightful interview via Dre41gaming: https://www.fightful.com/wrestling/ultra-violence-wrestling-game-developer-provides-update-game/
- DailyDDT 2021 preview: https://dailyddt.com/2021/09/24/ultra-violence-video-game-preview/
- Gameplay/dev footage roundup (YouTube): https://www.youtube.com/watch?v=WuTdgznrl1U

## Design thesis: "the logistics of deathmatches"
His own framing, and the single most important idea to steal: rather than spreading systems thin across match types, he poured all complexity into the **one-on-one violent brawl**. No tag teams, handicaps, or fatal four-ways at launch — explicitly so the deathmatch itself gets the depth ("When you add a third person into the mix, gameplay gets complicated to manage. If I start trying to do that, I'll probably never finish."). Lesson for BANNON: environmental-state depth beats roster breadth.

## Mechanics, concretely

### 1. Create-A-Ring (the standout system)
- Per-side rope customization: one side of the ring can be barbed wire, another side can have **no ropes at all**, another side a string of light tubes (Fightful).
- Layered ring destruction: tear up the ring mat → expose the boards underneath → remove the boards → expose barbed-wire netting (Fightful).
- Player-built ring setups with barbed wire, exposed ring floors (DailyDDT).

### 2. Create-A-Weapon
- Player-authored weapons, not just a weapon list (DailyDDT). Details of the authoring UI are UNVERIFIED publicly.

### 3. Light-tube ropes + six table scaffoldings
- Ropes made of light tubes as a ring configuration (DailyDDT).
- "Six table scaffoldings" — stacked-table structures as climbable/fall-through set pieces (DailyDDT). Exact configurations UNVERIFIED.

### 4. Tony Hawk-esque scoring / combo layer
- A scoring system where you **link moves and taunts** into scored sequences — the combo/rhythm layer, Arkham-lineage (DailyDDT).
- A **reversal meter** shown in gameplay footage (DailyDDT).
- Pre-alpha footage confirmed real grapple moves, not just weapon melee (DailyDDT).

### 5. Crowd throws weapons to you
- The audience participates: weapons get thrown into the ring from the crowd (DailyDDT). This is a match-logistics mechanic, not decoration.

### 6. Real deathmatch wrestlers, real bumps
- The promotion **Gorelando (Orland Death Squads)** assisted with bump and spot animations — i.e., real deathmatch wrestlers providing the motion reference (DailyDDT).
- Roster waves included real deathmatch names: G-Raver, Ruckus, Lou King Sharp, Akira the Death Samurai, John Wayne Murdoch, Reed Bentley. Small roster by design: 8–16, wrestlers from different eras. **American deathmatch style, explicitly not Japanese** (Fightful/DailyDDT).
- IP NOTE: these are real people's names/likenesses — BANNON must not copy them. Take the *system* (real-wrestler motion reference), not the roster.

### 7. SHOT CALLER (signature mechanic)
- **No public source found describing what Shot Caller is, mechanically.** Not in the Fightful interview, not in the DailyDDT preview, not in searchable @UVWPRO posts. Mark UNVERIFIED from public web — it likely comes from the dev's X posts or direct communication.
- Standing-doc interpretation: calling the spots / directing the match live. In wrestling terms, "calling it in the ring" is how wrestlers choreograph on the fly.
- Our working design (to validate): a live match-director layer where planned sequences ("spots") are queued and executed — hitting called spots builds crowd heat and score multipliers; improvising off-script carries risk/reward. This is the highest-value differentiator because no wrestling game ships anything like it.
- BANNON has a `MatchDirector.ts`, but it is a *narrative/career* pacing layer (rivalry heat from fight history) — not a live spot-calling system. Nothing overlaps.

## Platform/scope
- PC release planned. Pre-alpha footage existed (jobber brawls, a tattoo-needle spot, Ruckus's finishers). 1v1 only at launch.

## What BANNON takes from this (design DNA, not assets)
1. Shot Caller — live spot-calling/direction layer (nothing like it exists).
2. Combo/rhythm scoring that includes taunts, not just strikes.
3. Create-A-Ring depth: per-side rope configs + layered ring destruction (mat → boards → wire).
4. Create-A-Weapon authoring on top of the classified weapon library.
5. Deathmatch logistics: crowd-thrown weapons, scaffold/table structures, light-tube ropes.
6. Real-wrestler motion reference for bumps/spots (our own performers, our own canon).
