# QA After — Before/After Repair Comparison (2026-10-05)

56 repaired candidates in `out/<CHARACTER>_repaired.glb`. Raw numbers: `out/qa_after.jsonl`
vs baseline `out/qa_baseline.jsonl`. QA = `qa_pose.cjs` (8-joint action-pose LBS test).

**Mean p95 across 48 originally-skinned characters: 0.0261 → 0.0168 (−36%).**
8 previously-rigid (0-joint) characters now have full 58-joint rigs.

## Repair paths used
- **prune-only** (decompress → `prune_weights` f2.5 → `subtree_prune`): models whose own
  58-joint weights were decent; preserves authored skeleton/rest-pose.
- **transfer** (normalize → `transfer_weights` from BANNON_rigged → prune → subtree):
  models with no skin or fundamentally bad weights (p95 > 0.08). 58-joint donor
  skeleton; target mesh baked into donor bind space first (centered, 1.88 m).
- **merge+transfer**: BANNON / MAIME / MAIME_tattered were 15-part unrigged kits;
  parts merged (`merge_parts.cjs`, smooth normals computed), then transfer.

## Weak 7 (CI repair set)

| Model | Path | p95 | p999 | Spikes | Verdict |
|---|---|---|---|---|---|
| CIPHER | prune | 0.0156 → **0.0133** | 0.068 → 0.049 | 477 → 387 | ✓ better |
| ECHO | prune | 0.0224 → **0.0185** | 0.091 → 0.056 | 790 → 623 | ✓ better |
| STATIC | prune | 0.0170 → **0.0154** | 0.072 → 0.053 | 451 → 320 | ✓ better |
| CAIN_ELIAS_gear | prune | 0.0277 → **0.0258** | 0.114 → 0.113 | 2230 → 2127 | ~ marginal; transfer tried (0.0323, rejected — body 0.113 m from donor) |
| STICKUP | prune | 0.0161 → **0.0112** | 0.142 → 0.045 | 839 → 533 | ✓ better |
| CODY_gear | transfer | noskin → **0.0194** | → 0.053 | → 1309 | ✓ now rigged (was unit-box, normalized to 1.88 m) |
| ONYX | transfer | noskin → **0.0129** | → 0.045 | → 496 | ✓ now rigged |

## Biggest wins (transfer path)

| Model | p95 | Spikes | Notes |
|---|---|---|---|
| JAGER_beard | 0.1355 → **0.0181** | 7619 → 1366 | 7.5× p95 |
| JAGER | 0.1157 → **0.0162** | 6321 → 962 | 7× p95 (was feet-at-0; normalized to donor space) |
| TARZANIAN_DEVIL_skinned | 0.1160 → **0.0182** | 2842 → 243 | 6.4× p95, −91% spikes |

## New rigs (previously 0 joints)

| Model | p95 | Spikes | Notes |
|---|---|---|---|
| BANNON | 0.0138 | 116 | 15 parts merged; matches donor body (0.005 m) |
| MAIME | 0.0151 | 389 | 15 parts merged |
| MAIME_tattered | 0.0119 | 128 | 14 parts merged |
| ONYX_corset | 0.0133 | 296 | unit-box → donor space |
| TARZANIAN_DEVIL_dec | 0.0251 | 2872 | 78 k verts; spike *rate* ~1.8% of tris |
| BANNON_muscular | 0.0434 | 1803 | loosest fit (body 0.095 m from donor); usable, flag for muscular-specific donor |

## Plateau / needs-Blender-remap (Repo Co Dev track)

| Model | Result | Why node repairs plateaued |
|---|---|---|
| EDWIN_KENNEDY_unchained | 0.0474 → 0.0441, spikes 1199 → 1288 (+89!) | 46-joint skeleton missing spineChain/clavicles; prune can't fix wrong-dominant verts; spike regression — **do not promote**, needs joint graft/remap |
| CIPHER_feral | 0.0301 → 0.0294 | body 0.084 m from donor; transfer worse (0.0306) — needs sculpt-level weight work |
| TITAN / TITAN_white | 0.0212 → 0.0203 / 0.0186 → 0.0171 | transfer worse than prune-only; bodies resist donor mapping |
| CAIN_ELIAS_gear | 0.0277 → 0.0258 | body 0.113 m from donor; marginal |

## Remaining defect family (all models): mesh-bridge spikes

The stubborn worst-spikes (100–800×, single triangles) are **mesh topology**, not weights:
triangles whose verts sit on two touching surfaces (hand↔thigh, arm↔torso at armpit).
In bind pose the surfaces touch (1–4 cm edges); raising the limb stretches them 100×+.
Example: CIPHER's hand fused to thigh — 348 finger-bone-dominated verts interleave with
thigh verts. No weight edit can fix a triangle spanning two surfaces; needs mesh
separation (Blender) or contact-aware retriangulation. This matches the video
observation of shoulder/deltoid pinching on El Toro de Oro.

EL_TORO_DE_ORO (video hero): 0.0206 → **0.0140**, spikes 640 → 432 (−33%). Shoulder-weight
pinching reduced; the blobby hand *geometry* is untouched (mesh resolution, not weights).
Shoulder/delt-pec twisting is the owner's confirmed TOP priority defect family — the
8-joint QA pose stresses shoulders via arm raises on every model, so residual shoulder
issues show up in p95/spikes; expect similar small-joint issues across the roster.

## Full table

| Model | Before p95/spikes | After p95/spikes | Path |
|---|---|---|---|
| AARON_RUBEN | 0.0206 / 554 | 0.0165 / 372 | prune |
| BANNON | noskin | 0.0138 / 116 | merge+transfer |
| BANNON_muscular | noskin | 0.0434 / 1803 | transfer |
| BRUTUS | 0.0164 / 710 | 0.0145 / 649 | prune |
| CAIN_ELIAS_gear | 0.0277 / 2230 | 0.0258 / 2127 | prune |
| CAIN_ELIAS_godwithin | 0.0207 / 585 | 0.0167 / 434 | prune |
| CAIN_ELIAS_ring | 0.0175 / 742 | 0.0154 / 646 | prune |
| CAIN_ELIAS_snakeskin | 0.0174 / 536 | 0.0148 / 373 | prune |
| CIPHER | 0.0156 / 477 | 0.0133 / 387 | prune |
| CIPHER_feral | 0.0301 / 981 | 0.0294 / 895 | prune |
| CIPHER_minion | 0.0225 / 1255 | 0.0149 / 955 | prune |
| CIPHER_rigged (52j) | 0.0238 / 378 | 0.0212 / 311 | prune |
| CODY_gear | noskin | 0.0194 / 1309 | transfer |
| CODY_sober | 0.0203 / 935 | 0.0148 / 642 | prune |
| CODY_stressed | 0.0189 / 419 | 0.0171 / 344 | prune |
| ECHO | 0.0224 / 790 | 0.0185 / 623 | prune |
| EDWIN_KENNEDY | 0.0169 / 415 | 0.0141 / 317 | prune |
| EDWIN_KENNEDY_unchained (46j) | 0.0474 / 1199 | 0.0441 / 1288 | prune — PLATEAU |
| EL_TORO_DE_ORO | 0.0206 / 640 | 0.0140 / 432 | prune |
| HALL_NIGHTER | 0.0160 / 513 | 0.0142 / 447 | prune |
| HOLLOW | 0.0214 / 752 | 0.0187 / 645 | prune |
| JAGER | 0.1157 / 6321 | 0.0162 / 962 | transfer |
| JAGER_beard | 0.1355 / 7619 | 0.0181 / 1366 | transfer |
| KOBRA | 0.0154 / 439 | 0.0138 / 363 | prune |
| MAIME | noskin | 0.0151 / 389 | merge+transfer |
| MAIME_tattered | noskin | 0.0119 / 128 | merge+transfer |
| MASTER_SENSEI | 0.0210 / 570 | 0.0157 / 525 | prune |
| MASTER_SENSEI_rose | 0.0181 / 448 | 0.0142 / 312 | prune |
| NPC_FINXSSE | 0.0201 / 939 | 0.0141 / 710 | prune |
| ONYX | noskin | 0.0129 / 496 | transfer |
| ONYX_corset | noskin | 0.0133 / 296 | transfer |
| ONYX_straightjacket | 0.0268 / 1157 | 0.0218 / 951 | prune |
| ONYX_street | 0.0169 / 1193 | 0.0138 / 1046 | prune |
| PABLO | 0.0174 / 422 | 0.0155 / 334 | prune |
| PABLO_blackreign | 0.0185 / 639 | 0.0161 / 573 | prune |
| PABLO_goldenbull | 0.0208 / 690 | 0.0175 / 588 | prune |
| STAN_COMBS_gear | 0.0182 / 471 | 0.0165 / 358 | prune |
| STATIC | 0.0170 / 451 | 0.0154 / 320 | prune |
| STATIC_alt | 0.0166 / 492 | 0.0146 / 381 | prune |
| STICKUP | 0.0161 / 839 | 0.0112 / 533 | prune |
| TARZANIAN_DEVIL_dec | noskin | 0.0251 / 2872 | transfer |
| TARZANIAN_DEVIL_skinned | 0.1160 / 2842 | 0.0182 / 243 | transfer |
| TITAN | 0.0212 / 862 | 0.0203 / 837 | prune |
| TITAN_unmasked | 0.0201 / 794 | 0.0175 / 740 | prune |
| TITAN_white | 0.0186 / 694 | 0.0171 / 674 | prune |
| TRIPLE_XXX | 0.0157 / 377 | 0.0141 / 296 | prune |
| TRIPLE_XXX_suit | 0.0177 / 417 | 0.0158 / 371 | prune |
| TRIPLE_XXX_tights | 0.0158 / 339 | 0.0144 / 259 | prune |
| TRIPLE_XXX_trunks | 0.0180 / 485 | 0.0160 / 383 | prune |
| TYNESHIA | 0.0202 / 418 | 0.0174 / 340 | prune |
| TYNESHIA_street | 0.0153 / 457 | 0.0130 / 338 | prune |
| VIPER | 0.0168 / 492 | 0.0147 / 389 | prune |
| WRECK_PATTERSON | 0.0126 / 309 | 0.0113 / 251 | prune |
| WRECK_PATTERSON_attire2 | 0.0152 / 679 | 0.0128 / 584 | prune |
| WRECK_PATTERSON_attire3 | 0.0156 / 733 | 0.0129 / 608 | prune |
| WRECK_PATTERSON_godwithin | 0.0230 / 1189 | 0.0167 / 973 | prune |
