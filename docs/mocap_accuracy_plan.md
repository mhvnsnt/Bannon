# MOCAP → MOVE-ACCURACY PLAN (baked from the owner's long-updates txts, 2026-07-12/13 — BINDING)

Owner directive: the banked 2K-mocap / move FBX clips are NOT just standalone moves — they are the
ACCURACY REFERENCE for our original authored grapple animations, phases, and sub-phases. Every
in-game move must read like the real move. Where no mocap exists yet, the owner will upload more
FBX; until then the authored pose is judged against video reference + the orientation rules.

## The correction workflow (per move)
1. **Inventory**: `tools/moves/wrestling_moves.json` maps move → clip. Moves with `clip` get step 2;
   moves without get flagged `needsClip:true` for the owner's next FBX batch.
2. **Sample the clip at phase boundaries**: extract joint transforms at the authored phase times
   (setup / lift / apex / deliver — the GRAPPLE_POSITIONS liftPoses stages). `tools/extract_anim.py`
   is the extractor; obey `docs/mocap_orientation_master_prompt.md` FIRST (orientation before
   magnitude: up-vector, facing, attacker side, joint bend direction via full-FK world transforms).
3. **Diff against authored poses**: compare the clip's joint angles at each boundary with the
   authored liftPoses/slave targets. Correct DIRECTION first (the documented failure modes: frog
   splash built like a dropkick, mirrored swanton, merged suplex families), magnitudes second.
4. **Keep it physics**: corrections update the authored POSE TARGETS — the PD solver still owns the
   motion between targets. Never bake the clip as a canned animation for gameplay (clips play
   verbatim only in CinematicDirector cutscenes).

## Engine laws from the txts (validated design, some already live)
- **RagdollBlendMatrix**: kinematic limbs during locomotion; on collision-velocity threshold the
  joint constraints loosen and blend to physics over a frame delta. During grapples the LUMBAR +
  THORACIC spine release fully to the solver so Apex stick input applies raw pitch/yaw torque —
  and the victim's ragdoll root parents to the ATTACKER'S SPINE during the bridge (bend WITH the
  lifter, no clip-through). [Partially live: two-body PD load coupling; spine-release deepening queued]
- **EmergentBotchMatrix / CriticalMassThreshold**: no canned botches — when compound resistance
  (victim mass × lifter limb damage × stamina depletion) beats available torque, sever the grapple
  IK constraints mid-move and let the unguided ragdoll finish the fall; lifter enters exhaustion
  crumple. [Struggle-lift sine is live; the hard-sever threshold is the next brick]
- **Velocity-clipped dives**: no target magnets — dive arcs computed from real body velocity; leg
  damage that drops run speed below the clearance threshold makes the ragdoll clip the ropes/apron;
  missed targets carry the arc into the barricade/floor with full lethality.
- **Injury-sagged lifts**: lift IK pelvis target drops when leg damage is critical — the slave pose
  sags to its knees under load, physics-driven.
- **Referee = physical entity** with vision (LoS cone), avoidance, bumps (native laws:
  `native/include/bannon_referee.h`; JS entity: `window.BANNON_REF`).
- **Submission = UI driving TORQUE**: the familiar meter UI maps to real joint torque → local limb
  HP → organic tap threshold (native `submissionStep`; JS wiring in the sub-minigame branch).
- **Modes matrix** (future bricks): Universe/Career = 2K BroadcastEventMatrix (promos, choice
  wheels, interactive backstage, physical consequences); Story = Tekken per-character cinematic
  splines (CinematicDirector, the ONE place raw FBX playback is allowed); GM = booking math
  (native `scoreShow`/politics); God Within = Devil-Within RPG w/ skill trees; Exhibition = full
  2K pre-match suite (rules toggles, referee select).

## Current clip bank
`assets/mocap/drive/` (owner uploads via Drive) + `assets/models/anims/` (X Bot locomotion) +
`assets/mocap/mocap_data_partial.json` (144-joint two-fighter AlternatingForearms — STUDIO-clip
conversion queued, needs the 144→rig joint map).
