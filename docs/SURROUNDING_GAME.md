# The surrounding game — full-universe structure (MDickie-structured, BANNON canon)

The combat is deep; the game around it is fragmented. The owner: *use the MDickie zip to structure the
rest of the full surrounding game and the missing/unfinished parts.* MDickie's Wrestling MPire is a
complete career/universe sim, so its system map (extracted by `tools/bbparse/` into
`tools/bbparse/out/surrounding_systems.json`) is the blueprint. This maps that proven structure onto
BANNON's canon — proprietary names, the 41-canon roster, AWE + JPCW promotions, factions, God Within.
Raw `.bb` is NOT committed (third-party); this is the transformative distillation.

## The 7 surrounding systems (what BANNON is missing, and the MDickie functions that define each)

### 1. Career / Universe (`Career.bb` → 42 fns)
The spine. `Calendar` + `Production` + `GenerateCareer` drive a week-by-week loop; `NextDate`/`GetWeek`/
`DescribeDate` advance time; `AssignOpponent`/`AssignPartner`/`AssignReferee`/`GetMatchRules` book cards;
`InjuryStatus`/`IdentifyInjury`/`InjuryDate` run injuries; `CountMatches`/`CountWins`/`GetWinRate`/
`CountTitles`/`TitleHolder` track records; `CountRelationships`/`AllegianceRatio` track alignment;
`CountSalaries`/`ProductionCosts`/`PromotionPotential` run the money. `CourtDate`/`ConstructInterPromotional`
handle drama + cross-promotion (AWE ↔ JPCW).
→ **BANNON:** a Universe/Career mode: a calendar of AWE/JPCW shows, auto-booked cards from the roster,
records + titles, injuries feeding `matchConsequence` (native `bannon_universe.h`), money/promotion growth.

### 2. World / Arena (`World.bb` → 26 fns)
`GenerateArena`/`DecorateArena`/`DecorateRing`/`ApronColour`/`LoadLighting`/`ManageAtmos` build + dress the
venue; `GenerateAttendance`/`TranslateAttendance` fill the crowd by drawing power; `Camera`/`WatchAngle`/
`EyeLevel`/`CamViable` run broadcast cameras.
→ **BANNON:** the Arena Creator (the SOON hub tile) + attendance driven by the booking's heat, wired to the
existing broadcast-grade camera. Ring colors already parity-locked (`FBannonRingColors`).

### 3. Contracts / Negotiations (`Negotiations.bb` → 12 fns)
`CalculateWorth`/`GetValue`/`FigureRange` price a wrestler; `GenerateContract`/`ClauseFilter`/
`ClauseEntitled`/`GetContractVerdict` negotiate terms; `SellCharacter`/`RiskOffers`/`PushLuck` = the
free-agency market.
→ **BANNON:** signings/free-agency between AWE + JPCW + the independents, worth from momentum/record/titles.

### 4. News / Events (`News.bb` → 10 fns)
`AdvanceDate`/`FindEvents`/`AddEvent`/`NewsReports`/`FindTradeReactions`/`WinEffect` = the weekly news feed
+ dirt-sheet reactions to results and trades.
→ **BANNON:** a news/dirt-sheet feed reacting to matches, turns, signings — the storyline texture.

### 5. Tournaments (`Tournaments.bb` → 9 fns)
`GenerateTournament`/`DrawBracket`/`BracketSide`/`CupStage`/`SimulateBracket` = full bracket tournaments,
playable or simulated.
→ **BANNON:** title tournaments + the King-of-the-ring style events; sim the ones the player isn't in.

### 6. Promos / Relationships / Turns (`Promos.bb` → 22 fns)
`DisplayPromo`/`PreparePromo`/`Speak`/`DisplaySubtitles`/`FacialExpressions` run cutscene promos;
`FormTeam`/`ChangeRelationship`/`ChangeAllegiance`/`FindFriend`/`FindEnemy`/`AnnounceBreakup`/`PushTurn` =
the alliance/heel-face-turn engine (the drama). Ties to our FACS facial system + the Director.
→ **BANNON:** promo cutscenes (Tekken-depth story), the faction/allegiance web (Alliance / Corporate /
Agents / Independents), heel↔face turns — the God Within betrayal arc lives here.

### 7. Tag Teams (`Teams.bb` → 5 fns)
`LoadTeamMoveSequences`/`TeamMoves`/`FindAssistance`/`PotentialAssistance`/`FindTeamMove` = tag moves +
partner interference.
→ **BANNON:** TAG match type (still 'soon' in v152) + manager/partner interference (CHAR_MANAGERS is seeded).

## Build order (fills the fragmented/unfinished parts)
1. **Universe/Career loop** (system 1) — the shell everything hangs on: calendar → auto-book → play/sim →
   records/injuries/money → advance. Data model first (JSON, like the DNA schema), then UI.
2. **Promos/relationships + News** (6, 4) — the story/drama layer that makes it a *universe*, not exhibition.
3. **Contracts + Tournaments** (3, 5) — the meta depth.
4. **Arena Creator + attendance** (2) — the venue side (the SOON hub tile).
5. **Tag/interference** (7) — needs the TAG match type finished.

Native anchors already exist in `bannon_universe.h` (booking score math, match consequence, politics,
crowd reaction) — these systems are the JS/data layer + UI on top. The creation-suite hub (main menu)
is where Career / Universe / Arena Creator / Booking screens attach.
