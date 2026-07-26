#!/usr/bin/env node
/* BANNON MOVESET SCHEMA BUILDER — the WWE-2K Create-A-Moveset structure, as DATA.
 *
 *   node tools/moves/build_moveset_schema.cjs
 *
 * The owner supplied the complete 2K25/2K26 Move-Set library layout: every category, subcategory,
 * slot and pick-count. Hardcoding that into UI markup would make it unreadable and impossible to
 * extend, so it lives here as a schema and the editor renders itself from it. Adding a category
 * later is a data edit, not a UI rewrite.
 *
 * Each slot declares:
 *   id      stable key used for storage + equippedClipFor() lookups
 *   label   what the editor shows
 *   pick    how many moves this slot holds (2K's "Pick 3", "Pick 5"...)
 *   kind    what TYPE of move is legal here — this is the position lock. 2K will not let you put a
 *           top-rope dive in a standing light attack slot, and neither will we.
 *   pos     the ENGINE position this maps to, so a binding can reach real mocap + real physics
 *   ai      whether AI Priority/Repetition/Timing apply (2K: everything except sigs/finishers)
 */
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '..', '..', 'assets', 'moves', 'moveset_schema.json');

let n = 0;
const S = (id, label, pick, kind, pos, ai) => { n++; return { id, label, pick: pick || 1, kind, pos: pos || null, ai: ai !== false }; };
const G = (label, slots) => ({ label, slots });
const C = (id, label, groups) => ({ id, label, groups });

const CATS = [
  C('STANDING', 'Standing', [
    G('Front', [
      S('ST_F_LIGHT',      'Light Attack',      3, 'strike',   'STANDING_FRONT'),
      S('ST_F_COMBO',      'Combo Chains',      3, 'combo',    'STANDING_FRONT'),
      S('ST_F_ENDER_SQ',   'Combo Ender · Square', 3, 'combo_ender', 'STANDING_FRONT'),
      S('ST_F_ENDER_X',    'Combo Ender · Cross',  9, 'combo_ender', 'STANDING_FRONT'),
      S('ST_F_ENDER_O',    'Combo Ender · Circle', 18,'combo_ender', 'STANDING_FRONT'),
      S('ST_F_HEAVY',      'Heavy Attack',      3, 'strike',   'STANDING_FRONT'),
      S('ST_F_LGRAP',      'Light Grapple',     5, 'grapple',  'STANDING_FRONT'),
      S('ST_F_HGRAP',      'Heavy Grapple',     5, 'grapple',  'STANDING_FRONT'),
      S('ST_F_RUN_L',      'Running · Light',   1, 'strike',   'RUNNING'),
      S('ST_F_RUN_H',      'Running · Heavy',   1, 'strike',   'RUNNING'),
      S('ST_F_RUN_G',      'Running · Grapple', 1, 'grapple',  'RUNNING')
    ]),
    G('Rear', [
      S('ST_R_HEAVY',      'Heavy Attack',      1, 'strike',   'STANDING_REAR'),
      S('ST_R_LGRAP',      'Light Grapple',     5, 'grapple',  'STANDING_REAR'),
      S('ST_R_HGRAP',      'Heavy Grapple',     5, 'grapple',  'STANDING_REAR'),
      S('ST_R_RUN_L',      'Running · Light',   1, 'strike',   'RUNNING'),
      S('ST_R_RUN_H',      'Running · Heavy',   1, 'strike',   'RUNNING'),
      S('ST_R_RUN_G',      'Running · Grapple', 1, 'grapple',  'RUNNING')
    ]),
    // CARRY IS A SYSTEM, NOT A MOVE (owner correction). The lift is the setup; the real depth is the
    // follow-up pool that opens once they are up there. Each carry therefore declares its own
    // follow-up slots: drops, environmental throws, pin combos, transitions.
    G('Carry', [
      S('CARRY_POWERBOMB', 'Powerbomb Carry',   1, 'carry',    'CARRY_POWERBOMB'),
      S('CARRY_PB_DROP',   '  ↳ Drop / Driver', 3, 'carry_finish', 'CARRY_POWERBOMB'),
      S('CARRY_PB_ENV',    '  ↳ Environmental', 2, 'carry_env',    'CARRY_POWERBOMB'),
      S('CARRY_PB_PIN',    '  ↳ Pin Combination',1,'carry_pin',    'CARRY_POWERBOMB'),
      S('CARRY_FIREMAN',   "Fireman's Carry",   1, 'carry',    'CARRY_FIREMAN'),
      S('CARRY_FM_DROP',   '  ↳ Drop / Driver', 3, 'carry_finish', 'CARRY_FIREMAN'),
      S('CARRY_FM_ENV',    '  ↳ Environmental', 2, 'carry_env',    'CARRY_FIREMAN'),
      S('CARRY_FM_PIN',    '  ↳ Pin Combination',1,'carry_pin',    'CARRY_FIREMAN'),
      S('CARRY_SHOULDER',  'Shoulder Carry',    1, 'carry',    'CARRY_SHOULDER'),
      S('CARRY_SH_DROP',   '  ↳ Drop / Driver', 3, 'carry_finish', 'CARRY_SHOULDER'),
      S('CARRY_SH_ENV',    '  ↳ Environmental', 2, 'carry_env',    'CARRY_SHOULDER'),
      S('CARRY_SH_PIN',    '  ↳ Pin Combination',1,'carry_pin',    'CARRY_SHOULDER'),
      S('CARRY_CRADLE',    'Cradle Carry',      1, 'carry',    'CARRY_CRADLE'),
      S('CARRY_CR_DROP',   '  ↳ Drop / Driver', 3, 'carry_finish', 'CARRY_CRADLE'),
      S('CARRY_CR_ENV',    '  ↳ Environmental', 2, 'carry_env',    'CARRY_CRADLE'),
      S('CARRY_CR_PIN',    '  ↳ Pin Combination',1,'carry_pin',    'CARRY_CRADLE')
    ]),
    G('Foot Catch', [
      S('FC_LIGHT',        'Light Attack',      1, 'strike',     'FOOT_CATCH'),
      S('FC_HEAVY',        'Heavy Attack',      1, 'strike',     'FOOT_CATCH'),
      S('FC_SUB',          'Foot Catch Submission', 1, 'submission', 'FOOT_CATCH'),
      S('FC_REV',          'Reversal',          1, 'reversal',   'FOOT_CATCH')
    ]),
    G('Leverage Pin', [
      S('LEV_FRONT',       'Front',             1, 'pin', 'STANDING_FRONT'),
      S('LEV_REAR',        'Rear',              1, 'pin', 'STANDING_REAR')
    ])
  ]),

  C('GROUND', 'Ground', [
    G('Supine · Face Up', [
      S('GS_UP_ATK',  'Upper · Attack',  1, 'strike',     'GROUNDED_HEAD_UP'),
      S('GS_UP_LIMB', 'Upper · Limb',    1, 'limb',       'GROUNDED_HEAD_UP'),
      S('GS_UP_GRAP', 'Upper · Grapple', 1, 'grapple',    'GROUNDED_HEAD_UP'),
      S('GS_SD_ATK',  'Side · Attack',   1, 'strike',     'GROUNDED_SIDE'),
      S('GS_SD_LIMB', 'Side · Limb',     1, 'limb',       'GROUNDED_SIDE'),
      S('GS_SD_GRAP', 'Side · Grapple',  1, 'grapple',    'GROUNDED_SIDE'),
      S('GS_LO_ATK',  'Lower · Attack',  1, 'strike',     'GROUNDED_LEG'),
      S('GS_LO_LIMB', 'Lower · Limb',    1, 'limb',       'GROUNDED_LEG'),
      S('GS_LO_GRAP', 'Lower · Grapple', 1, 'grapple',    'GROUNDED_LEG'),
      S('GS_RUN',     'Running',         1, 'strike',     'GROUNDED_HEAD_UP')
    ]),
    G('Prone · Face Down', [
      S('GP_UP_ATK',  'Upper · Attack',  1, 'strike',  'GROUNDED_HEAD_DOWN'),
      S('GP_UP_LIMB', 'Upper · Limb',    1, 'limb',    'GROUNDED_HEAD_DOWN'),
      S('GP_UP_GRAP', 'Upper · Grapple', 1, 'grapple', 'GROUNDED_HEAD_DOWN'),
      S('GP_SD_ATK',  'Side · Attack',   1, 'strike',  'GROUNDED_SIDE'),
      S('GP_SD_LIMB', 'Side · Limb',     1, 'limb',    'GROUNDED_SIDE'),
      S('GP_SD_GRAP', 'Side · Grapple',  1, 'grapple', 'GROUNDED_SIDE'),
      S('GP_LO_ATK',  'Lower · Attack',  1, 'strike',  'GROUNDED_LEG'),
      S('GP_LO_LIMB', 'Lower · Limb',    1, 'limb',    'GROUNDED_LEG'),
      S('GP_LO_GRAP', 'Lower · Grapple', 1, 'grapple', 'GROUNDED_LEG')
    ]),
    G('Kneeling', [
      S('GK_F_LIGHT', 'Front · Light Attack',   1, 'strike',  'KNEELING'),
      S('GK_F_HEAVY', 'Front · Heavy Attack',   1, 'strike',  'KNEELING'),
      S('GK_F_LGRAP', 'Front · Light Grapple',  1, 'grapple', 'KNEELING'),
      S('GK_F_HGRAP', 'Front · Heavy Grapple',  1, 'grapple', 'KNEELING'),
      S('GK_F_RUN',   'Front · Running Attack', 1, 'strike',  'KNEELING'),
      S('GK_R_LGRAP', 'Rear · Light Grapple',   1, 'grapple', 'KNEELING_REAR'),
      S('GK_R_HGRAP', 'Rear · Heavy Grapple',   1, 'grapple', 'KNEELING_REAR')
    ]),
    G('Seated', [
      S('GT_F_HEAVY', 'Front · Heavy Attack',   1, 'strike',  'SEATED'),
      S('GT_F_GRAP',  'Front · Grapple',        1, 'grapple', 'SEATED'),
      S('GT_F_RUN',   'Front · Running',        1, 'strike',  'SEATED'),
      S('GT_R_HEAVY', 'Rear · Heavy Attack',    1, 'strike',  'SEATED_REAR'),
      S('GT_R_GRAP',  'Rear · Grapple',         1, 'grapple', 'SEATED_REAR')
    ]),
    G('Corner', [ S('GC_VS_GROUND', 'Corner vs Grounded Opponent', 1, 'strike', 'CORNER_TO_GROUND') ])
  ]),

  C('CORNER', 'Corner', [
    G('Leaning · Front', [
      S('CN_F_LIGHT', 'Light Attack',   1, 'strike',  'CORNER_FRONT'),
      S('CN_F_HEAVY', 'Heavy Attack',   1, 'strike',  'CORNER_FRONT'),
      S('CN_F_HGRAP', 'Heavy Grapple',  3, 'grapple', 'CORNER_FRONT'),
      S('CN_F_RUN_L', 'Light Running',  1, 'strike',  'CORNER_FRONT'),
      S('CN_F_RUN_H', 'Heavy Running',  1, 'strike',  'CORNER_FRONT'),
      S('CN_F_RUN_G', 'Grab Running',   1, 'grapple', 'CORNER_FRONT')
    ]),
    G('Leaning · Rear', [
      S('CN_R_LIGHT', 'Light Attack',   1, 'strike',  'CORNER_BACK'),
      S('CN_R_HEAVY', 'Heavy Attack',   1, 'strike',  'CORNER_BACK'),
      S('CN_R_HGRAP', 'Heavy Grapple',  3, 'grapple', 'CORNER_BACK'),
      S('CN_R_RUN',   'Running Attack', 1, 'strike',  'CORNER_BACK')
    ]),
    G('Top Rope Stunned · Front', [
      S('CN_TF_HEAVY','Heavy Attack',   1, 'strike',  'TURNBUCKLE_TOP'),
      S('CN_TF_GRAP', 'Grapple',        1, 'grapple', 'TURNBUCKLE_TOP')
    ]),
    G('Top Rope Stunned · Rear', [
      S('CN_TR_HEAVY','Heavy Attack',   1, 'strike',  'TURNBUCKLE_TOP'),
      S('CN_TR_GRAP', 'Grapple',        1, 'grapple', 'TURNBUCKLE_TOP')
    ]),
    G('Seated', [
      S('CN_S_HEAVY', 'Heavy Attack',   1, 'strike',  'CORNER_SEATED'),
      S('CN_S_GRAP',  'Grapple',        1, 'grapple', 'CORNER_SEATED'),
      S('CN_S_RUN',   'Running Attack', 1, 'strike',  'CORNER_SEATED')
    ]),
    G('Tree of Woe', [
      S('CN_TW_HEAVY','Heavy Attack',   1, 'strike',  'TREE_OF_WOE'),
      S('CN_TW_RUN',  'Running Attack', 1, 'strike',  'TREE_OF_WOE')
    ])
  ]),

  C('ROPE', 'Rope', [
    G('Leaning', [
      S('RP_L_LIGHT', 'Light Attack',   1, 'strike',  'ROPE_LEAN'),
      S('RP_L_HEAVY', 'Heavy Attack',   1, 'strike',  'ROPE_LEAN'),
      S('RP_L_HGRAP', 'Heavy Grapple',  3, 'grapple', 'ROPE_LEAN'),
      S('RP_L_RUN',   'Running Attack', 1, 'strike',  'ROPE_LEAN')
    ]),
    G('Middle Rope', [
      S('RP_M_HEAVY', 'Heavy Attack',   1, 'strike',  'MIDDLE_ROPE'),
      S('RP_M_RUN',   'Running Attack', 1, 'strike',  'MIDDLE_ROPE')
    ])
  ]),

  C('IRISH_WHIP', 'Irish Whip', [
    G('Rebound', [
      S('IW_ACTION',  'Rebound Action', 2, 'rebound', 'IRISH_WHIP'),
      S('IW_R_LIGHT', 'Rebound · Light Attack',  1, 'strike',  'ROPE_REBOUND'),
      S('IW_R_HEAVY', 'Rebound · Heavy Attack',  1, 'strike',  'ROPE_REBOUND'),
      S('IW_R_GRAP',  'Rebound · Grapple',       1, 'grapple', 'ROPE_REBOUND')
    ]),
    G('Pullback', [
      S('IW_P_LIGHT', 'Pullback · Light Attack', 1, 'strike', 'IRISH_WHIP'),
      S('IW_P_HEAVY', 'Pullback · Heavy Attack', 1, 'strike', 'IRISH_WHIP')
    ])
  ]),

  C('APRON', 'Apron', [
    G('From Ring', [
      S('AP_FR_HEAVY','Front · Heavy Attack',  1, 'strike',  'APRON'),
      S('AP_FR_HGRAP','Front · Heavy Grapple', 1, 'grapple', 'APRON'),
      S('AP_FR_GRAP', 'Front · Grapple',       1, 'grapple', 'APRON'),
      S('AP_FR_REAR', 'Rear · Grapple',        1, 'grapple', 'APRON')
    ]),
    G('From Apron', [
      S('AP_TR_HEAVY','To Ring · Heavy Attack',        1, 'strike',  'APRON_TO_RING'),
      S('AP_TR_GRAP', 'To Ring · Grapple',             1, 'grapple', 'APRON_TO_RING'),
      S('AP_RS_STAND','To Ringside · vs Standing',     1, 'strike',  'APRON'),
      S('AP_RS_SUP',  'To Ringside · vs Supine',       1, 'strike',  'APRON')
    ]),
    G('To Apron', [ S('AP_DRAG', 'Drag to Apron', 1, 'grapple', 'APRON') ])
  ]),

  C('DIVING', 'Diving', [
    G('Top Rope', [
      S('DV_TR_L',     'Light Dive',            1, 'dive', 'TURNBUCKLE_TOP'),
      S('DV_TR_H',     'Heavy Dive',            1, 'dive', 'TURNBUCKLE_TOP'),
      S('DV_TR_L_SUP', 'Light Dive · vs Supine',1, 'dive', 'TURNBUCKLE_TOP'),
      S('DV_TR_H_SUP', 'Heavy Dive · vs Supine',1, 'dive', 'TURNBUCKLE_TOP')
    ]),
    G('Middle Rope', [
      S('DV_MR_L',     'Light Dive',            1, 'dive', 'MIDDLE_ROPE'),
      S('DV_MR_H',     'Heavy Dive',            1, 'dive', 'MIDDLE_ROPE'),
      S('DV_MR_L_SUP', 'Light Dive · vs Supine',1, 'dive', 'MIDDLE_ROPE'),
      S('DV_MR_H_SUP', 'Heavy Dive · vs Supine',1, 'dive', 'MIDDLE_ROPE')
    ]),
    G('Ledge',         [ S('DV_LG_ST','vs Standing',1,'dive','DIVE_TO_FLOOR'), S('DV_LG_SUP','vs Supine',1,'dive','DIVE_TO_FLOOR') ]),
    G('Equipment Box', [ S('DV_EB_ST','vs Standing',1,'dive','DIVE_TO_FLOOR'), S('DV_EB_SUP','vs Supine',1,'dive','DIVE_TO_FLOOR') ]),
    G('Barricade',     [ S('DV_BR_ST','vs Standing',1,'dive','DIVE_TO_FLOOR'), S('DV_BR_SUP','vs Supine',1,'dive','DIVE_TO_FLOOR') ])
  ]),

  C('SPRINGBOARD', 'Springboard', [
    G('To Ring',    [ S('SB_TR_ST','vs Standing',5,'dive','SPRINGBOARD'), S('SB_TR_SUP','vs Supine',5,'dive','SPRINGBOARD') ]),
    G('To Ringside',[ S('SB_RS_ST','vs Standing',5,'dive','SPRINGBOARD'), S('SB_RS_SUP','vs Supine',5,'dive','SPRINGBOARD') ])
  ]),

  C('SUBMISSIONS', 'Holds / Submissions', [
    G('Holds', [
      S('SUB_STAND', 'Standing Submission',        1, 'submission', 'STANDING_FRONT'),
      S('SUB_FOOT',  'Foot Catch Submission',      1, 'submission', 'FOOT_CATCH'),
      S('SUB_UPPER', 'Upper Body Ground',          1, 'submission', 'GROUNDED_HEAD_UP'),
      S('SUB_SIDE',  'Side Ground',                1, 'submission', 'GROUNDED_SIDE'),
      S('SUB_LOWER', 'Lower Body Ground',          1, 'submission', 'GROUNDED_LEG'),
      // Rest holds were a real category in the simulation-era games and 2K dropped them. Ours keeps
      // them: a hold you apply to SLOW the match and recover, not to finish. Owner north-star note.
      S('SUB_REST',  'Rest Hold',                  2, 'rest_hold',  'STANDING_FRONT')
    ])
  ]),

  C('SIGNATURE', 'Signatures', [
    G('Signature', [
      S('SIG_RING',  'In-Ring',  5, 'signature', null, false),
      S('SIG_SIDE',  'Ringside', 2, 'signature', null, false)
    ])
  ]),

  C('FINISHER', 'Finishers', [
    G('Finisher', [
      S('FIN_RING',  'In-Ring',  5, 'finisher', null, false),
      S('FIN_SIDE',  'Ringside', 2, 'finisher', null, false),
      S('FIN_TAG',   'Tag Team', 2, 'finisher', null, false),
      S('FIN_LADDER','Ladder',   2, 'finisher', null, false),
      S('FIN_TABLE', 'Table',    2, 'finisher', null, false),
      S('FIN_RUMBLE','Rumble',   4, 'finisher', null, false)
    ]),
    G('Other', [
      S('FIN_1V2',    '1v2 Finisher',      1, 'finisher', null, false),
      S('FIN_CATCH',  'Catching Finisher', 1, 'finisher', null, false),
      S('FIN_LEDGE',  'Ledge Finisher',    1, 'finisher', null, false),
      S('FIN_CELL',   'Break Cell Wall',   1, 'finisher', null, false)
    ])
  ]),

  C('MATCH_TYPE', 'Match Type', [
    G('Table',  [ S('MT_TABLE',  'Table Moves',  7, 'table',  'TABLE') ]),
    G('Ladder', [ S('MT_LADDER', 'Ladder Moves', 5, 'ladder', 'LADDER') ]),
    G('Rumble', [ S('MT_RUMBLE', 'Rumble Moves', 4, 'rumble', 'ROPE_LEAN') ]),
    G('Tag Team', [
      S('MT_TAG_ATK',   'Normal Tag Attacks',  4, 'tag', 'STANDING_FRONT'),
      S('MT_TAG_FIN',   'Normal Tag Finishers',2, 'tag', null, false),
      S('MT_MIX_ATK',   'Mixed Tag Attacks',   4, 'tag', 'STANDING_FRONT'),
      S('MT_MIX_FIN',   'Mixed Tag Finishers', 2, 'tag', null, false),
      S('MT_DOUBLE',    'Double Team',         4, 'tag', 'STANDING_FRONT')
    ]),
    G('Hell in a Cell', [
      S('MT_HIAC_THROW','Ledge Throw',    1, 'grapple', 'DIVE_TO_FLOOR'),
      S('MT_HIAC_WALL', 'Break Cell Wall',1, 'grapple', 'DIVE_TO_FLOOR')
    ])
  ]),

  C('OTHER', 'Other Attacks', [
    G('Environment', [
      S('OA_BAR_HEAVY','Barricade · Heavy Attack', 1, 'strike',  'BARRICADE'),
      S('OA_BAR_GRAP', 'Barricade · Grapple',      1, 'grapple', 'BARRICADE'),
      S('OA_TABLE_FIN','Announce Table Finisher',  1, 'finisher','ANNOUNCE_TABLE', false),
      S('OA_LEDGE_FIN','Ledge Finisher',           1, 'finisher','DIVE_TO_FLOOR',  false),
      // Weapon grapples were a peak-SvR feature 2K cut back hard. Ours keeps dedicated slots.
      S('OA_WEAP_GRAP','Weapon Grapple',           3, 'weapon_grapple', 'STANDING_FRONT'),
      S('OA_WEAP_STRK','Weapon Strike',            3, 'weapon_strike',  'STANDING_FRONT')
    ]),
    G('Momentum', [
      S('OA_COMEBACK','Comeback', 1, 'comeback', 'STANDING_FRONT', false),
      S('OA_FREEZE',  'Freeze',   1, 'freeze',   'STANDING_FRONT', false)
    ])
  ]),

  C('PREMATCH', 'Pre-Match', [
    G('Warmup', [
      S('PM_WARMUP',   'Warmup',                 3, 'taunt', 'TAUNT', false),
      S('PM_TITLE_C',  'Title Match · Champion', 1, 'taunt', 'TAUNT', false),
      S('PM_TITLE_X',  'Title Match · Challenger',1,'taunt', 'TAUNT', false)
    ])
  ]),

  // THE OLD SMACKDOWN "BASES". The owner is right that these made every wrestler feel distinct just
  // by how they stood, walked and entered — and that 2K flattened them. Full category here.
  C('BASES', 'Bases · Stance & Motion', [
    G('Idle', [
      S('BS_STANCE',  'Fighting Stance',   1, 'stance',      'STANCE', false),
      S('BS_IDLE_T',  'Idle · Taunting',   1, 'stance',      'STANCE', false),
      S('BS_IDLE_H',  'Idle · Hurt',       1, 'stance',      'STANCE', false)
    ]),
    G('Locomotion', [
      S('BS_WALK',    'Walking Style',     1, 'locomotion',  'LOCOMOTION', false),
      S('BS_RUN',     'Running Style',     1, 'locomotion',  'LOCOMOTION', false),
      S('BS_STRAFE',  'Strafe / Circle',   1, 'locomotion',  'LOCOMOTION', false),
      S('BS_HURT_WALK','Injured Walk',     1, 'locomotion',  'LOCOMOTION', false)
    ]),
    G('Ring In / Out', [
      S('BS_RING_IN', 'Enter Ring',        1, 'movement', 'APRON_TO_RING', false),
      S('BS_RING_OUT','Exit Ring',         1, 'movement', 'APRON',         false),
      S('BS_CLIMB',   'Climb Top Rope',    1, 'movement', 'TURNBUCKLE_TOP',false),
      S('BS_RECOVER', 'Instant Recovery',  1, 'movement', 'GROUND_TO_STANDING_WAKEUP', false)
    ]),
    G('Victory', [ S('BS_WIN', 'Winning Pose', 1, 'taunt', 'TAUNT', false) ])
  ]),

  C('TAUNTS', 'Taunts', [
    G('To Crowd', [
      S('TC_STAND', 'Standing',              4, 'taunt', 'TAUNT', false),
      S('TC_CORNER','Corner',                2, 'taunt', 'CORNER_FRONT', false),
      S('TC_TOP',   'Top Rope · Facing Ring',2, 'taunt', 'TURNBUCKLE_TOP', false),
      S('TC_MID',   'Middle Rope',           2, 'taunt', 'MIDDLE_ROPE', false),
      S('TC_AP_IN', 'Apron · Facing Ring',   2, 'taunt', 'APRON', false),
      S('TC_AP_OUT','Apron · Facing Ringside',2,'taunt', 'APRON', false)
    ]),
    G('To Opponent', [
      S('TO_STAND', 'To Standing',           4, 'taunt', 'TAUNT', false),
      S('TO_GROUND','To Ground',             4, 'taunt', 'GROUNDED_HEAD_UP', false),
      S('TO_CORNER','Corner',                2, 'taunt', 'CORNER_FRONT', false),
      S('TO_TOP',   'Top Rope · Facing Ring',2, 'taunt', 'TURNBUCKLE_TOP', false),
      S('TO_MID',   'Middle Rope',           2, 'taunt', 'MIDDLE_ROPE', false),
      S('TO_AP_IN', 'Apron · Facing Ring',   2, 'taunt', 'APRON', false),
      S('TO_AP_OUT','Apron · Facing Ringside',2,'taunt', 'APRON', false)
    ]),
    G('Wake Up', [
      S('TW_RING',  'In Ring',        1, 'taunt', 'TAUNT', false),
      S('TW_CORNER','Corner',         1, 'taunt', 'CORNER_FRONT', false),
      S('TW_TOP_R', 'Top Rope → Ring',1, 'taunt', 'TURNBUCKLE_TOP', false),
      S('TW_TOP_S', 'Top Rope → Ringside',1,'taunt','TURNBUCKLE_TOP', false),
      S('TW_MID',   'Middle Rope',    1, 'taunt', 'MIDDLE_ROPE', false),
      S('TW_AP_R',  'Apron → Ring',   1, 'taunt', 'APRON', false),
      S('TW_AP_S',  'Apron → Ringside',1,'taunt', 'APRON', false)
    ])
  ])
];

// AI settings vocabulary — 2K's exact options, so the editor can offer them verbatim
const AI = {
  priority:   ['Average','Preferred','Favorite','Low','Very Low'],
  repetition: ['Default','Allow Repeats','Only Once','Allow Flurry','Prefer Flurry'],
  timing:     ['Any','Avoid Early','Prefer Early','Early Only','Prefer Late','Late Only']
};

const totalPicks = CATS.reduce((a,c)=>a+c.groups.reduce((b,g)=>b+g.slots.reduce((d,s)=>d+s.pick,0),0),0);

fs.writeFileSync(OUT, JSON.stringify({
  _note:'AUTO-GENERATED by tools/moves/build_moveset_schema.cjs — the WWE-2K Create-A-Moveset structure as data. The editor renders itself from this; adding a category is a data edit, not a UI rewrite.',
  generated:new Date().toISOString().slice(0,10),
  categories:CATS.length, slots:n, assignableMoves:totalPicks, ai:AI, cats:CATS
}, null, 1));

console.log('categories        : ' + CATS.length);
console.log('slots             : ' + n);
console.log('assignable moves  : ' + totalPicks + '  (sum of every pick count)');
console.log('wrote assets/moves/moveset_schema.json');
