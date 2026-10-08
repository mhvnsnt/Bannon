# STICKUP — Character Card + Entrance Package

Date: 2026-10-05. Research only — nothing pushed, posted, or published.
Sources: owner specs (verbatim, 2026-10-05) + `canon/characters/stick_up_jackboy.txt` +
`assets/models/CANON_MODELS.md` + `Off The Top Rope` book files + repo code search.

## Billing block

| Field | Value |
|---|---|
| Ring name (DISPLAY — on screen, in game, everywhere) | **Stick-Up** (primary presentation — NOT cyborg form) |
| Real name | Andre Curtis (canon file + owner, match — CANON ONLY, never displayed; wrestlers don't go by real names) |
| Street name / nickname | Jackboy (canon) |
| Owner-assigned nicknames | **"The Enigmatic Gangster", "The Flamboyant Flexer"** — LOCKED by owner 2026-10-05 (both). NOT found in canon/books; owner-assigned |
| Billed from | **Americus, Georgia** (owner + canon birth chart, match) |
| Born | Oct 6, 2001, Americus GA (canon natal chart — flavor only, do not render unless owner approves) |
| Height | **6'1"** (LOCKED by owner) |
| Weight | **155 lbs** (owner: 150 or 155 → locked 155, tall/skinny build) |
| Canon forms (not current) | "Cyborg Stick Up", "Reverend Stick Up" (canon aliases — card presents base Stick Up only) |
| Canon look | Shirtless, silver cross chain, pink cargo joggers, dreads (`CANON_MODELS.md`) |
| Canon style | Registered **highFlyer** |

## Backstory / bio (canon + owner merged)

Canon (`canon/characters/stick_up_jackboy.txt`): Andre Curtis, Americus GA, wrestles as
Stick Up (also Cyborg Stick Up / Reverend Stick Up forms in later canon), street name Jackboy.
Owner gimmick (verbatim): "just an extreme wild gangster, he survived being shot 11 times."
The 11-shots detail is **owner spec — not found in canon files** (no conflict, just unverified
in books). No conflict between canon and owner specs otherwise: canon already names him
Jackboy from Americus, matching the owner's "based on my friend GMG Jackboy."

## Gimmick notes

- Extreme wild gangster energy; survived being shot 11 times (owner spec).
- Wild-eyed, tongue-out intensity — see Expression notes (deferred).
- Based on real person: GMG Jackboy (rapper, owner's friend). Treat with respect —
  this is a tribute character, not a parody.

## Gear list

- **Finger guns (NOT literal handguns)** — owner correction 2026-10-05: "not literal hand guns, finger guns, like Jeff Hardy." This is a TAUNT/pose, not a prop — no pistol GLB needed, nothing to build. The Hardy Boyz finger-guns entrance pose is iconic (verified via wrestling coverage). Implemented as animation/pose, listed in the taunt checklist (#2).
- Canon look items (already on model per CANON_MODELS.md): silver cross chain, pink cargo
  joggers, dreads, shirtless.

## Taunt checklist — Jeff Hardy style (for the moveset/animation team)

1. **Arms-spread crucifix pose** — standing (or on turnbuckle), arms wide, head back. THE Hardy signature.
2. **Finger guns ("hang guns")** — owner verbatim; pointed at crowd or opponent, wild grin.
3. **Kiss blown to the crowd** — hand to lips, blow it out; Hardy staple.
4. **Hair-shake / dread whip** — headbang shake with dreads flying.
5. **Pre-finisher shuffle** — little dancing foot-shuffle before the Twisted Faith (Hardy does this before Twist of Fate).
6. **Turnbuckle climb + arms-out** — scale the buckles, arms spread to the crowd before a high spot (Whisper-in-the-Wind/Swanton setup energy).
7. **Tongue-out wild-eyed face** — owner verbatim ("tongue out wild eyes and etc") → DEFERRED, see below.

## Expression notes — DEFERRED to GNM expression phase

Owner verbatim acknowledgment: "if mouth opening and tongue out are too hard to nail and
capture with our statue like models till we make mouth and expressions and such then
I understand."
- Tongue-out + wild-eyes expressions are **DEFERRED** until the GNM expression system
  (38 morph targets, expression components) is grafted onto roster bodies. NOT a launch
  blocker for the entrance video — capture the energy through taunts/gear/attitude instead.
- Wild-eye intensity can be partially sold now via camera (tight close-up) + the dread
  whip + finger-gun taunts.

## Finishers / signature moves (canon-verified)

From `canon/characters/stick_up_jackboy.txt` (verbatim): "leap of faith swanton bomb,
super leap of faith swanton 450 splash, fire thunder driver, twist of fate theatrical
twisting cutter or stunner."
- **"Twisted Faith"** — owner's in-universe name for the Twist of Fate. VERIFIED in books:
  7 matches across `Off The Top Rope` Book 1, 2, 4, 5 files. Canon character file still
  says "twist of fate" (older) — **owner spec wins: use "Twisted Faith"** on screen.
- **Swanton Bomb** ("Leap of Faith Swanton") + **450 Swanton** ("Super Leap of Faith 450") — canon-verified.
- **Fire Thunder Driver** — canon-verified (keep as-is unless owner renames).
- **Jeff Hardy / Sabu style moves** — owner says "it's in the book canon." General
  high-flyer/extreme style verified via highFlyer registration; specific Sabu-move names
  **UNVERIFIED** — do not invent; moveset team to pull from book text.

## Entrance music

- Artist: **GMG JackBoy** — owner's friend. NOTE: distinct artist from the famous
  "Jackboy" (1804 Records/EMPIRE, Sniper Gang affiliate) — do not confuse.
- Consistency check: GMG JackBoy's YouTube releases credit "Composer Lyricist: Andre' Curtis" —
  matches Stickup's canon real name. Identity confirmed.
- Owner rule: use **whichever GMG JackBoy song has the most views on YouTube**.
- Finding: view counts are **UNVERIFIED** — search snippets and page fetches do not expose
  view counts, and no chart source ranks his videos. Catalog found (Shazam artist page):
  albums *Can't Let The World In* (2026), *MOST HATED* (2024), *Back To The Bo* (2022),
  *Menace From Hell* (2020); singles "Game Over", "Voicemail", "Ridgeview Contraband",
  "Vengeance", "Testimony", "Last Ride", "THUG HARMONY", "C8", "MilkMariee", "Transgressions".
  One verified video URL: "Transgressions" — https://www.youtube.com/watch?v=PVCV_69YHjI
  (auto-generated YouTube topic upload, released 2026-03-24 — NOT confirmed as most-viewed).
- **Recommendation: owner (friend of the artist) confirms the pick** — he can ask GMG JackBoy
  directly which video leads.
- **NEEDS: audio file from owner or GMG JackBoy directly — do not rip from YouTube.**
- **LOCKED (owner 2026-10-05):** **"Out My Body" by GMG JackBoy** (owner-supplied MP3, Google Drive).
  File: `stickup/audio/stickup_entrance.mp3` — 116.8s (~1:57), 44.1kHz stereo, **~133 BPM**.
  Beat grid: `stickup/audio/stickup_beats.json` (266 beats).
- **Video cut:** `stickup/audio/stickup_video_cut.mp3` — first **50.05s** of the track, cut on a
  beat (matches the ~50s El Toro video length per owner). ID3 tagged: GMG JackBoy / Out My Body.
  The video uses this cut, edited to the beat.
- Uses: (1) background music for the Stick-Up video (the 50s cut); (2) his in-game entrance music
  (full track); (3) added to the game menu soundtrack list. In-game entrance + menu integration =
  engine work, queued pending teardown's audio-path findings.

## Height scale — ENGINE REQUIREMENT (owner global directive)

- Owner: height differences between characters MUST be visible in-game; currently all
  Tripo-made models are the same height, which is wrong.
- Stickup at 6'1" (1.854 m) vs. the 1.88 m donor space the repair program normalized to:
  height must come from **per-character scale metadata applied at runtime**, not baked
  into the GLB. Flag for the engine team: roster needs a height field (from billing)
  driving a root scale factor per character.
- Video notes: when capturing Stickup vs. other roster members, frame at least one
  two-shot showing the height difference once the scale system lands.

## Video notes for the capture team (entrance video / commercial)

- Format: **Bannon = entrance coronation** (per commercial creative-direction doc):
  titantron lower-third name card → entrance with taunts → finisher montage → tagline → end card.
- Capture list: (1) entrance walk with cross chain/joggers/dreads readable; (2) finger-gun
  + arms-spread + kiss taunts; (3) Twisted Faith setup (theatrical twisting cutter);
  (4) Swanton Bomb off the top; (5) wild-energy close-up (dread whip).
- On-screen text: name "STICK UP", billed "AMERICUS, GEORGIA", height "6'1\"", weight
  "155 LBS". Nickname line: owner-assigned ("The Enigmatic Gangster" / "The Flamboyant
  Flexer" — owner to pick one or both). NEVER placeholder text; anything unconfirmed →
  "parts unknown" per standing policy.
- Music: GMG JackBoy track (pending pick + audio file — video cut can be timed to a
  temp beat map, final sync when the file arrives).
- Proof-in-pudding: apply STICKUP's repaired model first (`STICKUP_repaired.glb`,
  p95 0.0161 → 0.0112, best on roster), then capture; footage must visibly confirm
  clean shoulder/delt deformation in the taunt frames.
