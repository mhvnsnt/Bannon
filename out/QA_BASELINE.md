# QA Baseline — Bannon Character GLBs (2026-10-05)

Node-only QA (no browser): `qa_pose.cjs` deforms a canonical 8-joint action pose
(hips/spine/legs/arms/forearms) by linear blend skinning in pure JS and reports:
- **p95** — 95th-percentile vertex residual vs rigid bone-follow (metres). Lower = better.
  The donor `BANNON_rigged.glb` scores 0.0134; `xbot.glb` (Mixamo reference) scores 0.
- **spikes** — triangles whose posed perimeter exceeds 2.5× rest perimeter (stretch/tear).
- **worst** — max spike ratio (single worst triangle).
- **cross** — verts with significant weight on a geometrically distant joint.

Visual reference (owner video 2026-10-05): the **El Toro de Oro entrance kit** is the
quality bar (not one of the weak 7). Observed: hands/fingers blobby at close range
(low-poly hand geometry), slight shoulder/deltoid pinching in raised-arm poses.
Hand geometry + shoulder deformation are therefore priority checks. The video's dark
opening 5s is a DELIBERATE dramatic effect (dark brooding matador, rim-light) — owner
says do NOT flag lighting as a defect. The "HOMETOWN: [PLACEHOLDER - NOT IN CANON]"
nameplate is a canon-data bug, not a model bug (see placeholder policy in ENGINE_ISSUES.md).

**Quality targets differ by game** (owner 2026-10-05): BANNON is meant to be high quality;
BRUTAL FIST is intentionally PS1-style low-poly (with quality options). Do NOT judge
Brutal Fist assets by Bannon's bar, and do not "fix" intentional low-poly as a defect.

## QA checks (node-only, `qa_pose.cjs`)
1. **Deformation residual** (p95 vs rigid bone-follow in an 8-joint action pose) — catches
   bad weights, cross-talk, shoulder/delt-pec twisting (owner-confirmed TOP priority;
   expect similar small-joint issues across many models).
2. **Spike triangles** (>2.5× edge stretch) — catches stretch/tear and mesh-bridge topology.
3. **Weight hygiene** — dead/unnormalized/invalid rows, bad joint indices.
4. **Finger/toe bone completeness** (owner-confirmed rig gap — "hands not doing right"):
   the 58-joint rig HAS 30 finger joints + 2 toe-base joints and they ARE weighted
   (donor: 10.6% of verts carry finger weight; El Toro: 7.3%), but hand geometry is
   low-poly/blobby so articulation reads poorly. EDWIN_KENNEDY_unchained (46j) has
   fingers but NO toe bones. Genuine gap = geometry density + toe segments, not missing bones.

## Severity ranking (before repair)

| Tier | Models |
|---|---|
| CRITICAL — no skin (rigid, 0 joints) | BANNON, BANNON_muscular, CODY_gear, MAIME, MAIME_tattered, ONYX, ONYX_corset, TARZANIAN_DEVIL_dec (+ `_rigready`/`_rig28` variants) |
| CRITICAL — p95 > 0.08 | JAGER_beard (0.1355, 7619 spikes), JAGER (0.1157, 6321), TARZANIAN_DEVIL_skinned (0.116, 2842) |
| HIGH — p95 0.025–0.08 or spikes > 1000 | EDWIN_KENNEDY_unchained (0.0474, 46-joint skel), CIPHER_feral (0.0301), CAIN_ELIAS_gear (0.0277, 2230 spikes), ONYX_straightjacket (0.0268), CIPHER_minion (0.0225, 1255 spikes), ONYX_street (0.0169, 1193 spikes), WRECK_PATTERSON_godwithin (0.023, 1189 spikes) |
| MEDIUM — p95 0.015–0.025 | ECHO, STATIC, STICKUP, CIPHER, EL_TORO_DE_ORO (0.0206, 640 — the video hero), TITAN ×3, PABLO ×3, TRIPLE_XXX ×4, TYNESHIA ×2, HOLLOW, HALL_NIGHTER, KOBRA, MASTER_SENSEI ×2, NPC_FINXSSE, CODY_sober/stressed, AARON_RUBEN, BRUTUS, CAIN_ELIAS ×3 (godwithin/ring/snakeskin), EDWIN_KENNEDY, VIPER, WRECK_PATTERSON_attire2/3, STAN_COMBS_gear, STATIC_alt |
| LOW — p95 < 0.015 | WRECK_PATTERSON (0.0126), TYNESHIA_street (0.0153), KOBRA (0.0154) |
| REFERENCE (not repaired) | BANNON_rigged (donor, 0.0134), xbot (0, Mixamo ref), wrestler_base (0.0053, 49j template) |
| EXCLUDED | `models/Models tripo3d/` WWE-named (Cena/Rhea/Brock/Priest/Goldberg/Cole — separate reskin track), `assets/models/props/wwe2k22_announcer_desk.glb`, `xbot.glb` |

## Per-character baseline numbers

p95 / spikes / worst-spike. `noskin` = 0 joints (rigid).

| Character | Joints | p95 | Spikes | Worst | Notes |
|---|---|---|---|---|---|
| JAGER_beard | 58 | 0.1355 | 7619 | 559× | worst skinned; wrong-dominant verts (armpit→Hips) |
| JAGER | 58 | 0.1157 | 6321 | 727× | same family |
| TARZANIAN_DEVIL_skinned | 58 | 0.1160 | 2842 | 124× | feet-at-0 authoring (donor is centred) |
| EDWIN_KENNEDY_unchained | 46 | 0.0474 | 1199 | 262× | 46-joint skel, missing spineChain/clavicles |
| CIPHER_feral | 58 | 0.0301 | 981 | 257× | feral body far from donor (0.084m) |
| CAIN_ELIAS_gear | 58 | 0.0277 | 2230 | 159× | body far from donor (0.113m) |
| ONYX_straightjacket | 58 | 0.0268 | 1157 | 468× | |
| CIPHER_rigged | 52 | 0.0238 | 378 | 35× | 52-joint variant skeleton |
| WRECK_PATTERSON_godwithin | 58 | 0.0230 | 1189 | 314× | |
| CIPHER_minion | 58 | 0.0225 | 1255 | 302× | |
| ECHO | 58 | 0.0224 | 790 | 212× | weak 7 |
| HOLLOW | 58 | 0.0214 | 752 | 172× | |
| TITAN | 58 | 0.0212 | 862 | 122× | |
| MASTER_SENSEI | 58 | 0.0210 | 570 | 28× | |
| PABLO_goldenbull | 58 | 0.0208 | 690 | 59× | |
| CAIN_ELIAS_godwithin | 58 | 0.0207 | 585 | 226× | |
| AARON_RUBEN | 58 | 0.0206 | 554 | 48× | |
| EL_TORO_DE_ORO | 58 | 0.0206 | 640 | 36× | video hero; shoulder pinch visible |
| CODY_sober | 58 | 0.0203 | 935 | 156× | |
| TYNESHIA | 58 | 0.0202 | 418 | 30× | |
| NPC_FINXSSE | 58 | 0.0201 | 939 | 311× | |
| TITAN_unmasked | 58 | 0.0201 | 794 | 113× | |
| CODY_stressed | 58 | 0.0189 | 419 | 77× | |
| TITAN_white | 58 | 0.0186 | 694 | 102× | |
| PABLO_blackreign | 58 | 0.0185 | 639 | 125× | |
| STAN_COMBS_gear | 58 | 0.0182 | 471 | 95× | |
| MASTER_SENSEI_rose | 58 | 0.0181 | 448 | 45× | |
| TRIPLE_XXX_trunks | 58 | 0.0180 | 485 | 45× | |
| TRIPLE_XXX_suit | 58 | 0.0177 | 417 | 78× | |
| CAIN_ELIAS_ring | 58 | 0.0175 | 742 | 164× | |
| PABLO | 58 | 0.0174 | 422 | 37× | |
| CAIN_ELIAS_snakeskin | 58 | 0.0174 | 536 | 135× | |
| STATIC | 58 | 0.0170 | 451 | 19× | weak 7 |
| ONYX_street | 58 | 0.0169 | 1193 | 178× | |
| EDWIN_KENNEDY | 58 | 0.0169 | 415 | 18× | |
| VIPER | 58 | 0.0168 | 492 | 120× | |
| STATIC_alt | 58 | 0.0166 | 492 | 21× | |
| BRUTUS | 58 | 0.0164 | 710 | 415× | |
| STICKUP | 58 | 0.0161 | 839 | 323× | weak 7; thumb↔thigh cross-talk |
| HALL_NIGHTER | 58 | 0.0160 | 513 | 185× | |
| TRIPLE_XXX_tights | 58 | 0.0158 | 339 | 19× | |
| TRIPLE_XXX | 58 | 0.0157 | 377 | 19× | |
| CIPHER | 58 | 0.0156 | 477 | 163× | weak 7; finger↔buttock weights |
| WRECK_PATTERSON_attire3 | 58 | 0.0156 | 733 | 218× | |
| KOBRA | 58 | 0.0154 | 439 | 171× | |
| TYNESHIA_street | 58 | 0.0153 | 457 | 97× | |
| WRECK_PATTERSON_attire2 | 58 | 0.0152 | 679 | 236× | |
| WRECK_PATTERSON | 58 | 0.0126 | 309 | 42× | cleanest of roster |
| BANNON_rigged | 58 | 0.0134 | 196 | 15× | DONOR (still has 196 spikes itself) |
| BANNON / BANNON_muscular / CODY_gear / MAIME / MAIME_tattered / ONYX / ONYX_corset / TARZANIAN_DEVIL_dec | 0 | noskin | — | — | rigid; BANNON/MAIME are 15-part; CODY/ONYX/TARZANIAN are unit-box Tripo outputs |

Raw JSON: `out/qa_baseline.jsonl`. QA tool: `out/qa_pose.cjs` (also at `/tmp/work/tools/qa_pose.cjs`
— copy is ephemeral; the `out/` copy persists).
