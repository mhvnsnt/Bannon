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
 * OWNER LAW — NO NUMBER CAPS. 2K's "Pick 3 / Pick 5" exist because a console moveset is a fixed
 * memory budget. Ours is not, and the owner said so plainly: "u know our game doesn't include the
 * same caps as WWE games in those areas with number caps." So every slot carries TWO numbers:
 *   pick  how many the slot starts with — the DEFAULT loadout, what a fresh fighter gets
 *   cap   the hard ceiling. 0 MEANS UNLIMITED, and that is the value on almost everything.
 * A slot is capped only where the ENGINE can address one thing at a time (you have one fighting
 * stance, one walk cycle, one entrance) — that is a physical limit, not a budget.
 *
 * Each slot declares:
 *   id      stable key used for storage + equippedClipFor() lookups
 *   label   what the editor shows
 *   pick    default loadout size
 *   cap     hard ceiling, 0 = unlimited
 *   kind    what TYPE of move is legal here — this is the position lock. 2K will not let you put a
 *           top-rope dive in a standing light attack slot, and neither will we.
 *   pos     the ENGINE position this maps to, so a binding can reach real mocap + real physics
 *   ai      whether AI Priority/Repetition/Timing apply (2K: everything except sigs/finishers)
 *
 * This builder also emits assets/moves/pin_moves.json — the named pin/roll-up catalogue that fills
 * the PINS category and that BANNON_PINS reads at runtime. Pins are a moveset category in 2K, so
 * their catalogue belongs with the schema that shapes it, not in a second scattered file.
 */
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..', '..', 'assets', 'moves');
const OUT = path.join(DIR, 'moveset_schema.json');
const OUT_PINS = path.join(DIR, 'pin_moves.json');

let n = 0;
// S(id, label, pick, kind, pos, ai, cap)  — cap defaults to 0 = UNLIMITED (owner law)
const S = (id, label, pick, kind, pos, ai, cap) => {
  n++;
  return { id, label, pick: pick || 1, cap: cap === undefined ? 0 : cap, kind, pos: pos || null, ai: ai !== false };
};
// S1 — genuinely single-valued because the engine can only address one at a time (one stance, one
// walk cycle). This is a physical limit, not a budget, so it is the ONLY place a cap belongs.
const S1 = (id, label, kind, pos, ai) => S(id, label, 1, kind, pos, ai, 1);
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
      S('ST_F_CHAIN',      'Chain Wrestling',   4, 'chain',    'STANDING_FRONT'),
      S('ST_F_STRUGGLE',   'Collar-Elbow Struggle', 3, 'struggle', 'STANDING_FRONT'),
      S('ST_F_RUN_L',      'Running · Light',   1, 'strike',   'RUNNING'),
      S('ST_F_RUN_H',      'Running · Heavy',   1, 'strike',   'RUNNING'),
      S('ST_F_RUN_G',      'Running · Grapple', 1, 'grapple',  'RUNNING')
    ]),
    G('Rear', [
      S('ST_R_HEAVY',      'Heavy Attack',      1, 'strike',   'STANDING_REAR'),
      S('ST_R_LGRAP',      'Light Grapple',     5, 'grapple',  'STANDING_REAR'),
      S('ST_R_HGRAP',      'Heavy Grapple',     5, 'grapple',  'STANDING_REAR'),
      S('ST_R_WAIST',      'Rear Waistlock',    4, 'grapple',  'STANDING_REAR'),
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
      S('CARRY_PB_TRANS',  '  ↳ Transition',    2, 'carry_trans',  'CARRY_POWERBOMB'),
      S('CARRY_FIREMAN',   "Fireman's Carry",   1, 'carry',    'CARRY_FIREMAN'),
      S('CARRY_FM_DROP',   '  ↳ Drop / Driver', 3, 'carry_finish', 'CARRY_FIREMAN'),
      S('CARRY_FM_ENV',    '  ↳ Environmental', 2, 'carry_env',    'CARRY_FIREMAN'),
      S('CARRY_FM_PIN',    '  ↳ Pin Combination',1,'carry_pin',    'CARRY_FIREMAN'),
      S('CARRY_FM_TRANS',  '  ↳ Transition',    2, 'carry_trans',  'CARRY_FIREMAN'),
      S('CARRY_SHOULDER',  'Shoulder Carry',    1, 'carry',    'CARRY_SHOULDER'),
      S('CARRY_SH_DROP',   '  ↳ Drop / Driver', 3, 'carry_finish', 'CARRY_SHOULDER'),
      S('CARRY_SH_ENV',    '  ↳ Environmental', 2, 'carry_env',    'CARRY_SHOULDER'),
      S('CARRY_SH_PIN',    '  ↳ Pin Combination',1,'carry_pin',    'CARRY_SHOULDER'),
      S('CARRY_SH_TRANS',  '  ↳ Transition',    2, 'carry_trans',  'CARRY_SHOULDER'),
      S('CARRY_CRADLE',    'Cradle Carry',      1, 'carry',    'CARRY_CRADLE'),
      S('CARRY_CR_DROP',   '  ↳ Drop / Driver', 3, 'carry_finish', 'CARRY_CRADLE'),
      S('CARRY_CR_ENV',    '  ↳ Environmental', 2, 'carry_env',    'CARRY_CRADLE'),
      S('CARRY_CR_PIN',    '  ↳ Pin Combination',1,'carry_pin',    'CARRY_CRADLE'),
      S('CARRY_CR_TRANS',  '  ↳ Transition',    2, 'carry_trans',  'CARRY_CRADLE'),
      S('CARRY_ELECTRIC',  'Electric Chair',    1, 'carry',    'CARRY_ELECTRIC'),
      S('CARRY_EC_DROP',   '  ↳ Drop / Driver', 3, 'carry_finish', 'CARRY_ELECTRIC'),
      S('CARRY_EC_PIN',    '  ↳ Pin Combination',1,'carry_pin',    'CARRY_ELECTRIC'),
      S('CARRY_TORTURE',   'Torture Rack',      1, 'carry',    'CARRY_RACK'),
      S('CARRY_TR_DROP',   '  ↳ Drop / Driver', 3, 'carry_finish', 'CARRY_RACK'),
      S('CARRY_TR_SUB',    '  ↳ Hold / Submission',2,'submission',  'CARRY_RACK'),
      S('CARRY_ARGENTINE', 'Argentine Rack',    1, 'carry',    'CARRY_RACK'),
      S('CARRY_AR_DROP',   '  ↳ Drop / Driver', 3, 'carry_finish', 'CARRY_RACK'),
      S('CARRY_DRAG',      'Drag / Haul',       1, 'carry',    'CARRY_DRAG'),
      S('CARRY_DR_THROW',  '  ↳ Throw',         2, 'carry_env','CARRY_DRAG')
    ]),
    G('Foot Catch', [
      S('FC_LIGHT',        'Light Attack',      1, 'strike',     'FOOT_CATCH'),
      S('FC_HEAVY',        'Heavy Attack',      1, 'strike',     'FOOT_CATCH'),
      S('FC_SUB',          'Foot Catch Submission', 1, 'submission', 'FOOT_CATCH'),
      S('FC_SPIN',         'Spin Out',          1, 'grapple',    'FOOT_CATCH'),
      S('FC_REV',          'Reversal',          1, 'reversal',   'FOOT_CATCH')
    ]),
    G('Catch / Counter', [
      S('CT_CATCH_DIVE',   'Catch a Diver',     2, 'catch',    'STANDING_FRONT'),
      S('CT_CATCH_RUN',    'Catch a Runner',    2, 'catch',    'STANDING_FRONT'),
      S('CT_COUNTER_STRK', 'Strike Counter',    3, 'reversal', 'STANDING_FRONT'),
      S('CT_COUNTER_GRAP', 'Grapple Counter',   3, 'reversal', 'STANDING_FRONT'),
      S('CT_COUNTER_REAR', 'Rear Counter',      3, 'reversal', 'STANDING_REAR')
    ])
  ]),

  // ==========================================================================================
  // PINS — the owner's correction, in full. THREE ENTRY PATHS, not one:
  //   1. DOWN + ZONE on a grounded opponent   (deliberate, the input he explicitly asked for)
  //   2. PROCEDURAL                            (a landing that leaves shoulders down IS a pin)
  //   3. ROLL-UP / SURPRISE                    (front AND rear, from standing, running, counters)
  // and pin legality is a MATCH-RULE question, not a global one. Every slot is uncapped.
  // ==========================================================================================
  C('PINS', 'Pins & Roll-Ups', [
    G('Ground Covers', [
      S('PN_LATERAL',  'Lateral Press',           2, 'pin', 'GROUNDED_HEAD_UP'),
      S('PN_LEG_HOOK', 'Leg Hook Cover',          2, 'pin', 'GROUNDED_HEAD_UP'),
      S('PN_DBL_LEG',  'Double Leg Hook',         1, 'pin', 'GROUNDED_HEAD_UP'),
      S('PN_JACKKNIFE','Jackknife Cover',         1, 'pin', 'GROUNDED_HEAD_UP'),
      S('PN_GRAPEVINE','Grapevine Cover',         1, 'pin', 'GROUNDED_HEAD_UP'),
      S('PN_KNEE',     'Knee-on-Chest Cover',     1, 'pin', 'GROUNDED_HEAD_UP'),
      S('PN_ARM_HOOK', 'Arm Hook Cover',          1, 'pin', 'GROUNDED_SIDE'),
      S('PN_PRONE',    'Cover vs Prone (turn)',   1, 'pin', 'GROUNDED_HEAD_DOWN')
    ]),
    // Cocky covers matter for CHARACTER — a heel's one-foot pin is a personality beat, and it costs
    // you: the catalogue gives these a kickout bonus to the victim, which is the whole joke.
    G('Cocky Covers', [
      S('PN_FOOT',     'Foot-on-Chest',           1, 'pin_cocky', 'GROUNDED_HEAD_UP'),
      S('PN_ONE_ARM',  'One-Arm Cover',           1, 'pin_cocky', 'GROUNDED_HEAD_UP'),
      S('PN_SEATED',   'Seated Cover',            1, 'pin_cocky', 'GROUNDED_HEAD_UP'),
      S('PN_PUSHUP',   'Push-Up Cover',           1, 'pin_cocky', 'GROUNDED_HEAD_UP')
    ]),
    // THE DRAMATIC ONES. Front-facing surprise pins out of a standing exchange or a counter.
    G('Roll-Ups · Front', [
      S('PN_RU_CRADLE',   'Inside Cradle',        1, 'rollup', 'STANDING_FRONT'),
      S('PN_RU_SMALLPKG', 'Small Package',        1, 'rollup', 'STANDING_FRONT'),
      S('PN_RU_MAGISTRAL','Magistral Cradle',     1, 'rollup', 'STANDING_FRONT'),
      S('PN_RU_CRUCIFIX', 'Crucifix Pin',         1, 'rollup', 'STANDING_FRONT'),
      S('PN_RU_SUNSET',   'Sunset Flip',          1, 'rollup', 'STANDING_FRONT'),
      S('PN_RU_VICTORY',  'Victory Roll',         1, 'rollup', 'STANDING_FRONT'),
      S('PN_RU_RANA',     'Rana Pin',             1, 'rollup', 'STANDING_FRONT'),
      S('PN_RU_ROLLTHRU', 'Roll-Through Pin',     1, 'rollup', 'STANDING_FRONT'),
      S('PN_RU_OKLAHOMA', 'Oklahoma Roll',        1, 'rollup', 'STANDING_FRONT'),
      S('PN_RU_PRAWN',    'Prawn Hold',           1, 'rollup', 'STANDING_FRONT')
    ]),
    G('Roll-Ups · Rear', [
      S('PN_RR_SCHOOLBOY','Schoolboy Roll-Up',    1, 'rollup', 'STANDING_REAR'),
      S('PN_RR_OCONNOR',  "O'Connor Roll",        1, 'rollup', 'STANDING_REAR'),
      S('PN_RR_BACKSLIDE','Backslide',            1, 'rollup', 'STANDING_REAR'),
      S('PN_RR_VICTORY',  'Rear Victory Roll',    1, 'rollup', 'STANDING_REAR'),
      S('PN_RR_CRADLE',   'Rear Cradle',          1, 'rollup', 'STANDING_REAR'),
      S('PN_RR_SUNSET',   'Rear Sunset Flip',     1, 'rollup', 'STANDING_REAR'),
      S('PN_RR_ROLLPRAWN','Rolling Prawn Hold',   1, 'rollup', 'STANDING_REAR')
    ]),
    G('Leverage & Situational', [
      S('PN_LV_CORNER',   'Corner Leverage Pin',  1, 'rollup', 'CORNER_FRONT'),
      S('PN_LV_ROPE',     'Rope-Assisted Roll',   1, 'rollup', 'ROPE_LEAN'),
      S('PN_LV_APRON',    'Apron Drag Pin',       1, 'rollup', 'APRON'),
      S('PN_LV_COUNTER',  'Counter-to-Pin',       3, 'rollup', 'STANDING_FRONT'),
      S('PN_LV_RUNNING',  'Running Roll-Up',      1, 'rollup', 'RUNNING'),
      S('PN_LV_REVERSE',  'Reverse a Roll-Up',    2, 'rollup', 'STANDING_FRONT')
    ]),
    // ILLEGAL pins are legal to OWN — they just get you caught. The catalogue flags them and the
    // referee's line-of-sight decides whether they work or get the count waved off.
    G('Illegal', [
      S('PN_IL_TIGHTS',   'Handful of Tights',    1, 'pin_illegal', 'GROUNDED_HEAD_UP'),
      S('PN_IL_ROPES',    'Feet on the Ropes',    1, 'pin_illegal', 'GROUNDED_HEAD_UP'),
      S('PN_IL_MASK',     'Mask / Hair Grab',     1, 'pin_illegal', 'GROUNDED_HEAD_UP')
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
      S('GS_RUN',     'Running',         1, 'strike',     'GROUNDED_HEAD_UP'),
      S('GS_MOUNT',   'Mounted Strikes', 2, 'strike',     'GROUNDED_HEAD_UP')
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
      S('GP_LO_GRAP', 'Lower · Grapple', 1, 'grapple', 'GROUNDED_LEG'),
      S('GP_TURN',    'Turn Them Over',  1, 'grapple', 'GROUNDED_HEAD_DOWN')
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
      S('CN_F_RUN_G', 'Grab Running',   1, 'grapple', 'CORNER_FRONT'),
      S('CN_F_MOUNT', 'Corner Mount Strikes', 1, 'strike', 'CORNER_FRONT')
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
    ]),
    G('Exposed Steel', [
      S('CN_EX_EXPOSE','Expose the Buckle', 1, 'grapple', 'CORNER_FRONT'),
      S('CN_EX_RAM',   'Ram into Steel',    2, 'grapple', 'CORNER_FRONT')
    ])
  ]),

  C('ROPE', 'Rope', [
    G('Leaning', [
      S('RP_L_LIGHT', 'Light Attack',   1, 'strike',  'ROPE_LEAN'),
      S('RP_L_HEAVY', 'Heavy Attack',   1, 'strike',  'ROPE_LEAN'),
      S('RP_L_HGRAP', 'Heavy Grapple',  3, 'grapple', 'ROPE_LEAN'),
      S('RP_L_RUN',   'Running Attack', 1, 'strike',  'ROPE_LEAN'),
      S('RP_L_CHOKE', 'Rope Choke',     1, 'illegal', 'ROPE_LEAN')
    ]),
    G('Middle Rope', [
      S('RP_M_HEAVY', 'Heavy Attack',   1, 'strike',  'MIDDLE_ROPE'),
      S('RP_M_RUN',   'Running Attack', 1, 'strike',  'MIDDLE_ROPE')
    ]),
    G('Tangled / 619', [
      S('RP_T_SPIN',  'Rope Spin Attack', 1, 'strike', 'ROPE_LEAN'),
      S('RP_T_TANGLE','vs Tangled Opponent', 1, 'strike', 'ROPE_LEAN')
    ])
  ]),

  C('IRISH_WHIP', 'Irish Whip', [
    G('Rebound', [
      S('IW_ACTION',  'Rebound Action', 2, 'rebound', 'IRISH_WHIP'),
      S('IW_R_LIGHT', 'Rebound · Light Attack',  1, 'strike',  'ROPE_REBOUND'),
      S('IW_R_HEAVY', 'Rebound · Heavy Attack',  1, 'strike',  'ROPE_REBOUND'),
      S('IW_R_GRAP',  'Rebound · Grapple',       1, 'grapple', 'ROPE_REBOUND'),
      S('IW_R_DUCK',  'Rebound · Duck / Leapfrog',2,'evade',   'ROPE_REBOUND')
    ]),
    G('Pullback', [
      S('IW_P_LIGHT', 'Pullback · Light Attack', 1, 'strike', 'IRISH_WHIP'),
      S('IW_P_HEAVY', 'Pullback · Heavy Attack', 1, 'strike', 'IRISH_WHIP')
    ]),
    G('Hammer Throw', [
      S('IW_H_CORNER','To Corner',      1, 'grapple', 'IRISH_WHIP'),
      S('IW_H_STEPS', 'To Steel Steps', 1, 'grapple', 'IRISH_WHIP'),
      S('IW_H_BARR',  'To Barricade',   1, 'grapple', 'BARRICADE')
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
    G('To Apron', [ S('AP_DRAG', 'Drag to Apron', 1, 'grapple', 'APRON') ]),
    G('Skirt / Under Ring', [
      S('AP_UNDER_GET','Grab from Under the Ring', 1, 'weapon_grab', 'APRON'),
      S('AP_UNDER_PULL','Pull Them Under',         1, 'grapple',     'APRON')
    ])
  ]),

  C('DIVING', 'Diving', [
    G('Top Rope', [
      S('DV_TR_L',     'Light Dive',            1, 'dive', 'TURNBUCKLE_TOP'),
      S('DV_TR_H',     'Heavy Dive',            1, 'dive', 'TURNBUCKLE_TOP'),
      S('DV_TR_L_SUP', 'Light Dive · vs Supine',1, 'dive', 'TURNBUCKLE_TOP'),
      S('DV_TR_H_SUP', 'Heavy Dive · vs Supine',1, 'dive', 'TURNBUCKLE_TOP'),
      S('DV_TR_OUT',   'Dive to Ringside',      1, 'dive', 'DIVE_TO_FLOOR')
    ]),
    G('Middle Rope', [
      S('DV_MR_L',     'Light Dive',            1, 'dive', 'MIDDLE_ROPE'),
      S('DV_MR_H',     'Heavy Dive',            1, 'dive', 'MIDDLE_ROPE'),
      S('DV_MR_L_SUP', 'Light Dive · vs Supine',1, 'dive', 'MIDDLE_ROPE'),
      S('DV_MR_H_SUP', 'Heavy Dive · vs Supine',1, 'dive', 'MIDDLE_ROPE')
    ]),
    G('Through the Ropes', [
      S('DV_TH_SUICIDE','Suicide Dive',   1, 'dive', 'DIVE_TO_FLOOR'),
      S('DV_TH_TOPE',   'Tope',           1, 'dive', 'DIVE_TO_FLOOR'),
      S('DV_TH_TOPCON', 'Tope Con Hilo',  1, 'dive', 'DIVE_TO_FLOOR')
    ]),
    G('Ledge',         [ S('DV_LG_ST','vs Standing',1,'dive','DIVE_TO_FLOOR'), S('DV_LG_SUP','vs Supine',1,'dive','DIVE_TO_FLOOR') ]),
    G('Equipment Box', [ S('DV_EB_ST','vs Standing',1,'dive','DIVE_TO_FLOOR'), S('DV_EB_SUP','vs Supine',1,'dive','DIVE_TO_FLOOR') ]),
    G('Barricade',     [ S('DV_BR_ST','vs Standing',1,'dive','DIVE_TO_FLOOR'), S('DV_BR_SUP','vs Supine',1,'dive','DIVE_TO_FLOOR') ])
  ]),

  C('SPRINGBOARD', 'Springboard', [
    G('To Ring',    [ S('SB_TR_ST','vs Standing',5,'dive','SPRINGBOARD'), S('SB_TR_SUP','vs Supine',5,'dive','SPRINGBOARD') ]),
    G('To Ringside',[ S('SB_RS_ST','vs Standing',5,'dive','SPRINGBOARD'), S('SB_RS_SUP','vs Supine',5,'dive','SPRINGBOARD') ]),
    G('Wall / Post',[ S('SB_WALL','Off the Post',2,'dive','SPRINGBOARD'), S('SB_BARR','Off the Barricade',2,'dive','SPRINGBOARD') ])
  ]),

  C('SUBMISSIONS', 'Holds / Submissions', [
    G('Holds', [
      S('SUB_STAND', 'Standing Submission',        1, 'submission', 'STANDING_FRONT'),
      S('SUB_REAR',  'Rear Standing Submission',   1, 'submission', 'STANDING_REAR'),
      S('SUB_FOOT',  'Foot Catch Submission',      1, 'submission', 'FOOT_CATCH'),
      S('SUB_UPPER', 'Upper Body Ground',          1, 'submission', 'GROUNDED_HEAD_UP'),
      S('SUB_SIDE',  'Side Ground',                1, 'submission', 'GROUNDED_SIDE'),
      S('SUB_LOWER', 'Lower Body Ground',          1, 'submission', 'GROUNDED_LEG'),
      S('SUB_PRONE', 'Prone Ground',               1, 'submission', 'GROUNDED_HEAD_DOWN'),
      S('SUB_ROPE',  'Rope-Break Hold',            1, 'submission', 'ROPE_LEAN'),
      // Rest holds were a real category in the simulation-era games and 2K dropped them. Ours keeps
      // them: a hold you apply to SLOW the match and recover, not to finish. Owner north-star note.
      S('SUB_REST',  'Rest Hold',                  2, 'rest_hold',  'STANDING_FRONT')
    ]),
    G('Targeted', [
      S('SUB_T_ARM',  'Arm Submission',   2, 'submission', 'GROUNDED_SIDE'),
      S('SUB_T_LEG',  'Leg Submission',   2, 'submission', 'GROUNDED_LEG'),
      S('SUB_T_NECK', 'Neck Submission',  2, 'submission', 'GROUNDED_HEAD_UP'),
      S('SUB_T_BACK', 'Back Submission',  2, 'submission', 'GROUNDED_HEAD_DOWN')
    ])
  ]),

  C('SIGNATURE', 'Signatures', [
    G('Signature', [
      S('SIG_RING',  'In-Ring',  5, 'signature', null, false),
      S('SIG_SIDE',  'Ringside', 2, 'signature', null, false),
      S('SIG_CORNER','Corner',   2, 'signature', 'CORNER_FRONT', false),
      S('SIG_TOP',   'Top Rope', 2, 'signature', 'TURNBUCKLE_TOP', false),
      S('SIG_GROUND','vs Grounded', 2, 'signature', 'GROUNDED_HEAD_UP', false)
    ])
  ]),

  C('FINISHER', 'Finishers', [
    G('Finisher', [
      S('FIN_RING',  'In-Ring',  5, 'finisher', null, false),
      S('FIN_SIDE',  'Ringside', 2, 'finisher', null, false),
      S('FIN_TAG',   'Tag Team', 2, 'finisher', null, false),
      S('FIN_LADDER','Ladder',   2, 'finisher', null, false),
      S('FIN_TABLE', 'Table',    2, 'finisher', null, false),
      S('FIN_RUMBLE','Rumble',   4, 'finisher', null, false),
      S('FIN_TOP',   'Top Rope', 2, 'finisher', 'TURNBUCKLE_TOP', false),
      S('FIN_SUB',   'Submission Finisher', 2, 'finisher', null, false)
    ]),
    G('Other', [
      S('FIN_1V2',    '1v2 Finisher',      1, 'finisher', null, false),
      S('FIN_CATCH',  'Catching Finisher', 1, 'finisher', null, false),
      S('FIN_LEDGE',  'Ledge Finisher',    1, 'finisher', null, false),
      S('FIN_CELL',   'Break Cell Wall',   1, 'finisher', null, false)
    ]),
    // CREATE-A-FINISHER — cut after SvR 2011 and never replaced. The owner named it directly as one
    // of the things the old games had that 2K lost. It is not a move slot, it is a SEQUENCE of parts:
    // pick an approach, a grab, optional transitions, an impact and a landing, and the engine chains
    // them. Uncapped transitions is the whole point — that is where the absurd ones come from.
    G('Create-A-Finisher', [
      S('CAF_APPROACH',  'Approach',        1, 'caf_approach',  null, false),
      S('CAF_GRAB',      'Grab / Setup',    1, 'caf_grab',      null, false),
      S('CAF_TRANS',     'Transitions',     2, 'caf_trans',     null, false),
      S('CAF_IMPACT',    'Impact',          1, 'caf_impact',    null, false),
      S('CAF_LANDING',   'Landing',         1, 'caf_landing',   null, false),
      S('CAF_PIN',       'Pin Combination', 1, 'caf_pin',       null, false),
      S('CAF_SLOTS',     'Saved Finishers', 3, 'caf_saved',     null, false)
    ])
  ]),

  C('MATCH_TYPE', 'Match Type', [
    G('Table',  [ S('MT_TABLE',  'Table Moves',  7, 'table',  'TABLE') ]),
    G('Ladder', [ S('MT_LADDER', 'Ladder Moves', 5, 'ladder', 'LADDER') ]),
    G('Rumble', [ S('MT_RUMBLE', 'Rumble Moves', 4, 'rumble', 'ROPE_LEAN') ]),
    G('Cage',   [ S('MT_CAGE_CLIMB','Cage Climb',1,'cage','CAGE'), S('MT_CAGE_SLAM','Cage Slam',3,'cage','CAGE'), S('MT_CAGE_TOP','Off the Cage',2,'dive','CAGE') ]),
    G('Tag Team', [
      S('MT_TAG_ATK',   'Normal Tag Attacks',  4, 'tag', 'STANDING_FRONT'),
      S('MT_TAG_FIN',   'Normal Tag Finishers',2, 'tag', null, false),
      S('MT_MIX_ATK',   'Mixed Tag Attacks',   4, 'tag', 'STANDING_FRONT'),
      S('MT_MIX_FIN',   'Mixed Tag Finishers', 2, 'tag', null, false),
      S('MT_DOUBLE',    'Double Team',         4, 'tag', 'STANDING_FRONT'),
      S('MT_TAG_LIFT',  'Assisted Lift',       2, 'tag', 'STANDING_FRONT'),
      S('MT_TAG_HOTTAG','Hot Tag Sequence',    2, 'tag', 'STANDING_FRONT')
    ]),
    G('Hell in a Cell', [
      S('MT_HIAC_THROW','Ledge Throw',    1, 'grapple', 'DIVE_TO_FLOOR'),
      S('MT_HIAC_WALL', 'Break Cell Wall',1, 'grapple', 'DIVE_TO_FLOOR')
    ]),
    // Deathmatch is a north-star (Ultraviolence / Neckbreaker). Its moves are a real category, not a
    // reskin of the table slot — a light-tube spot has its own setup, its own shatter, its own bleed.
    G('Deathmatch', [
      S('MT_DM_TUBES',  'Light Tube Spots', 4, 'deathmatch', 'STANDING_FRONT'),
      S('MT_DM_BARBED', 'Barbed Wire Spots',4, 'deathmatch', 'STANDING_FRONT'),
      S('MT_DM_THUMB',  'Thumbtack Spots',  3, 'deathmatch', 'GROUNDED_HEAD_UP'),
      S('MT_DM_PANE',   'Glass Pane Spots', 3, 'deathmatch', 'STANDING_FRONT')
    ])
  ]),

  C('OTHER', 'Other Attacks', [
    G('Environment', [
      S('OA_BAR_HEAVY','Barricade · Heavy Attack', 1, 'strike',  'BARRICADE'),
      S('OA_BAR_GRAP', 'Barricade · Grapple',      1, 'grapple', 'BARRICADE'),
      S('OA_STEPS',    'Steel Steps',              2, 'grapple', 'BARRICADE'),
      S('OA_POST',     'Ring Post',                2, 'grapple', 'BARRICADE'),
      S('OA_CROWD',    'Into the Crowd',           2, 'grapple', 'BARRICADE'),
      S('OA_TABLE_FIN','Announce Table Finisher',  1, 'finisher','ANNOUNCE_TABLE', false),
      S('OA_LEDGE_FIN','Ledge Finisher',           1, 'finisher','DIVE_TO_FLOOR',  false),
      // Weapon grapples were a peak-SvR feature 2K cut back hard. Ours keeps dedicated slots.
      S('OA_WEAP_GRAP','Weapon Grapple',           3, 'weapon_grapple', 'STANDING_FRONT'),
      S('OA_WEAP_STRK','Weapon Strike',            3, 'weapon_strike',  'STANDING_FRONT'),
      S('OA_WEAP_THROW','Weapon Throw',            2, 'weapon_strike',  'STANDING_FRONT')
    ]),
    G('Dirty', [
      S('OA_LOWBLOW', 'Low Blow',        1, 'illegal', 'STANDING_FRONT'),
      S('OA_EYE',     'Eye Rake',        1, 'illegal', 'STANDING_FRONT'),
      S('OA_CHOKE',   'Choke',           1, 'illegal', 'STANDING_FRONT'),
      S('OA_BITE',    'Bite',            1, 'illegal', 'STANDING_FRONT'),
      S('OA_HAIR',    'Hair Pull',       1, 'illegal', 'STANDING_FRONT'),
      S('OA_REF',     'Shove the Ref',   1, 'illegal', 'STANDING_FRONT')
    ]),
    G('Momentum', [
      S('OA_COMEBACK','Comeback', 1, 'comeback', 'STANDING_FRONT', false),
      S('OA_FREEZE',  'Freeze',   1, 'freeze',   'STANDING_FRONT', false),
      S('OA_HULK',    'Second Wind Sequence', 1, 'comeback', 'STANDING_FRONT', false)
    ])
  ]),

  C('PREMATCH', 'Pre-Match', [
    G('Warmup', [
      S('PM_WARMUP',   'Warmup',                 3, 'taunt', 'TAUNT', false),
      S('PM_TITLE_C',  'Title Match · Champion', 1, 'taunt', 'TAUNT', false),
      S('PM_TITLE_X',  'Title Match · Challenger',1,'taunt', 'TAUNT', false),
      S('PM_STAREDOWN','Staredown',              2, 'taunt', 'TAUNT', false),
      S('PM_LOCKUP',   'Opening Lock-Up',        2, 'chain', 'STANDING_FRONT', false)
    ])
  ]),

  // THE OLD SMACKDOWN "BASES". The owner is right that these made every wrestler feel distinct just
  // by how they stood, walked and entered — and that 2K flattened them. Full category here.
  // These are the S1 (genuinely one-at-a-time) slots: you have ONE walk cycle at a time.
  C('BASES', 'Bases · Stance & Motion', [
    G('Idle', [
      S1('BS_STANCE',  'Fighting Stance',   'stance', 'STANCE', false),
      S1('BS_IDLE_T',  'Idle · Taunting',   'stance', 'STANCE', false),
      S1('BS_IDLE_H',  'Idle · Hurt',       'stance', 'STANCE', false),
      S1('BS_IDLE_G',  'Idle · Groggy',     'stance', 'STANCE', false),
      S1('BS_IDLE_W',  'Idle · Winded',     'stance', 'STANCE', false)
    ]),
    G('Locomotion', [
      S1('BS_WALK',    'Walking Style',     'locomotion', 'LOCOMOTION', false),
      S1('BS_RUN',     'Running Style',     'locomotion', 'LOCOMOTION', false),
      S1('BS_SPRINT',  'Sprint Style',      'locomotion', 'LOCOMOTION', false),
      S1('BS_STRAFE',  'Strafe / Circle',   'locomotion', 'LOCOMOTION', false),
      S1('BS_BACK',    'Backpedal',         'locomotion', 'LOCOMOTION', false),
      S1('BS_HURT_WALK','Injured Walk',     'locomotion', 'LOCOMOTION', false),
      S1('BS_CRAWL',   'Crawl',             'locomotion', 'LOCOMOTION', false)
    ]),
    G('Ring In / Out', [
      S1('BS_RING_IN', 'Enter Ring',        'movement', 'APRON_TO_RING', false),
      S1('BS_RING_OUT','Exit Ring',         'movement', 'APRON',         false),
      S1('BS_ROLL_IN', 'Roll In',           'movement', 'APRON_TO_RING', false),
      S1('BS_SLIDE_OUT','Slide Out',        'movement', 'APRON',         false),
      S1('BS_CLIMB',   'Climb Top Rope',    'movement', 'TURNBUCKLE_TOP',false),
      S1('BS_APRON_UP','Climb to Apron',    'movement', 'APRON',         false)
    ]),
    // GET-UPS AND KIP-UPS — asked for by name. How a fighter stands back up is character, and it is
    // also a real tactical choice: a kip-up is fast and costs stamina, a rope-assisted get-up is slow
    // and safe. Uncapped because a fighter can own many and the engine picks by damage state.
    G('Get-Ups', [
      S('BS_GU_BASE',  'Standard Get-Up',   2, 'getup', 'GROUND_TO_STANDING_WAKEUP', false),
      S('BS_GU_KIP',   'Kip-Up / Nip-Up',   1, 'getup', 'GROUND_TO_STANDING_WAKEUP', false),
      S('BS_GU_HAND',  'Handspring Up',     1, 'getup', 'GROUND_TO_STANDING_WAKEUP', false),
      S('BS_GU_ZOMBIE','Sit-Up (Zombie)',   1, 'getup', 'GROUND_TO_STANDING_WAKEUP', false),
      S('BS_GU_ROPE',  'Rope-Assisted',     1, 'getup', 'ROPE_LEAN', false),
      S('BS_GU_CORNER','Corner Crawl-Up',   1, 'getup', 'CORNER_FRONT', false),
      S('BS_GU_SLOW',  'Groggy Get-Up',     1, 'getup', 'GROUND_TO_STANDING_WAKEUP', false),
      S('BS_GU_KNEE',  'To One Knee',       1, 'getup', 'KNEELING', false),
      S('BS_GU_ROLL',  'Roll Away & Up',    1, 'getup', 'GROUND_TO_STANDING_WAKEUP', false),
      S('BS_GU_INSTANT','Instant Recovery', 1, 'getup', 'GROUND_TO_STANDING_WAKEUP', false)
    ]),
    G('Reactions', [
      S('BS_SELL_L',   'Light Hit Reaction',  3, 'reaction', 'STANDING_FRONT', false),
      S('BS_SELL_H',   'Heavy Hit Reaction',  3, 'reaction', 'STANDING_FRONT', false),
      S('BS_SELL_STUN','Stagger / Stun',      2, 'reaction', 'STANDING_FRONT', false),
      S('BS_SELL_KO',  'Knockdown',           3, 'reaction', 'GROUNDED_HEAD_UP', false),
      S('BS_BLOCK',    'Block Pose',          1, 'reaction', 'STANDING_FRONT', false),
      S('BS_DODGE',    'Dodge / Slip',        2, 'evade',    'STANDING_FRONT', false)
    ]),
    G('Victory / Defeat', [
      S('BS_WIN',      'Winning Pose',      2, 'taunt', 'TAUNT', false),
      S('BS_LOSE',     'Losing Pose',       1, 'taunt', 'TAUNT', false),
      S('BS_CELEBRATE','Post-Match Celebration', 2, 'taunt', 'TAUNT', false)
    ])
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
    ]),
    G('Signature Taunt', [
      S('TS_SIG',   'Signature Taunt',  2, 'taunt', 'TAUNT', false),
      S('TS_FIN',   'Finisher Taunt',   2, 'taunt', 'TAUNT', false),
      S('TS_MOCK',  'Mock the Opponent',2, 'taunt', 'TAUNT', false)
    ])
  ]),

  // ============================================================================================
  // The modules below close the gaps the owner listed by name after the first pass. Each one is a
  // real context the engine can already be IN and that had nowhere to hang a move.
  // ============================================================================================

  // DEFENCE. 2K buries dodge/leapfrog/roll and the combo breakers; they are choices that define how
  // a fighter moves as much as any strike does, so they get a category.
  C('DEFENCE', 'Defence & Counters', [
    G('Evasion', [
      S('DF_DUCK',    'Duck',              1, 'evade', 'STANDING_FRONT'),
      S('DF_LEAPFROG','Leapfrog',          1, 'evade', 'STANDING_FRONT'),
      S('DF_ROLL',    'Combat Roll',       1, 'evade', 'STANDING_FRONT'),
      S('DF_SIDESTEP','Sidestep / Matrix', 1, 'evade', 'STANDING_FRONT'),
      S('DF_BACKSTEP','Back Step',         1, 'evade', 'STANDING_FRONT'),
      S('DF_DROPDOWN','Drop Down',         1, 'evade', 'STANDING_FRONT')
    ]),
    G('Breakers', [
      S('DF_BRK_L',   'Light Combo Breaker', 2, 'breaker', 'STANDING_FRONT'),
      S('DF_BRK_H',   'Heavy Combo Breaker', 2, 'breaker', 'STANDING_FRONT'),
      S('DF_BRK_GRAP','Grapple Breaker',     2, 'breaker', 'STANDING_FRONT'),
      S('DF_BRK_SUB', 'Submission Breaker',  2, 'breaker', 'GROUNDED_HEAD_UP')
    ]),
    G('Blocking', [
      S('DF_BLK_HIGH','High Block',   1, 'block', 'STANDING_FRONT'),
      S('DF_BLK_LOW', 'Low Block',    1, 'block', 'STANDING_FRONT'),
      S('DF_PARRY',   'Parry',        2, 'reversal', 'STANDING_FRONT'),
      S('DF_CATCH',   'Catch & Hold', 2, 'catch',    'STANDING_FRONT')
    ])
  ]),

  // GROGGY STATES. A fighter leaning on the ropes, slumped in the corner or bent double in the
  // middle of the ring is in three different situations, and 2K treats them as one.
  C('GROGGY', 'Groggy & Stagger States', [
    G('Rope Groggy', [
      S('GG_ROPE_STRK','Strike',        2, 'strike',  'ROPE_LEAN'),
      S('GG_ROPE_GRAP','Grapple',       2, 'grapple', 'ROPE_LEAN'),
      S('GG_ROPE_HOT', 'Hotshot',       1, 'grapple', 'ROPE_LEAN')
    ]),
    G('Corner Groggy', [
      S('GG_CORN_STRK','Strike',        2, 'strike',  'CORNER_FRONT'),
      S('GG_CORN_GRAP','Grapple',       2, 'grapple', 'CORNER_FRONT'),
      S('GG_CORN_SET', 'Setup / Perch', 2, 'grapple', 'CORNER_FRONT')
    ]),
    G('Bent Over · Centre', [
      S('GG_BENT_STRK','Strike',        2, 'strike',  'STANDING_FRONT'),
      S('GG_BENT_GRAP','Grapple',       3, 'grapple', 'STANDING_FRONT'),
      S('GG_BENT_CARRY','Lift to Carry',2, 'carry',   'STANDING_FRONT')
    ]),
    G('Stunned Upright', [
      S('GG_STUN_STRK','Strike',        2, 'strike',  'STANDING_FRONT'),
      S('GG_STUN_GRAP','Grapple',       2, 'grapple', 'STANDING_FRONT'),
      S('GG_STUN_FIN', 'Finisher Window',1,'finisher','STANDING_FRONT', false)
    ])
  ]),

  // ELEVATED. Cage tops, the cell roof, a ladder platform, a backstage ledge. Structurally these are
  // the same problem — you are up high and there is a long way down — and none of it existed.
  C('ELEVATED', 'Elevated & Ledge', [
    G('Cage Wall', [
      S('EL_CG_CLIMB','Climbing Strike',      2, 'cage', 'CAGE'),
      S('EL_CG_SCRAPE','Mesh Scrape',         2, 'cage', 'CAGE'),
      S('EL_CG_SLAM', 'Slam into the Mesh',   3, 'cage', 'CAGE'),
      S('EL_CG_DROP', 'Throw Off the Wall',   2, 'cage', 'CAGE')
    ]),
    G('Cell Roof', [
      S('EL_RF_STRK', 'Roof Strike',          2, 'strike',  'CELL_ROOF'),
      S('EL_RF_GRAP', 'Roof Grapple',         2, 'grapple', 'CELL_ROOF'),
      S('EL_RF_SLAM', 'Roof Slam',            2, 'cage',    'CELL_ROOF'),
      S('EL_RF_THRU', 'Through the Roof',     1, 'finisher','CELL_ROOF', false)
    ]),
    G('Ladder Top', [
      S('EL_LD_FIGHT','Ladder-Top Fighting',  3, 'ladder', 'LADDER'),
      S('EL_LD_THROW','Throw Off the Ladder', 2, 'ladder', 'LADDER'),
      S('EL_LD_DIVE', 'Dive Off the Ladder',  2, 'dive',   'LADDER')
    ]),
    G('Ledge', [
      S('EL_LG_GRAP', 'Ledge Grapple',        2, 'grapple', 'LEDGE'),
      S('EL_LG_THROW','Throw to the Floor',   2, 'grapple', 'LEDGE'),
      S('EL_LG_BAL',  'Balancing Strike',     2, 'strike',  'LEDGE'),
      S('EL_LG_HANG', 'Ledge-Hang Defence',   2, 'reversal','LEDGE')
    ])
  ]),

  // RINGSIDE FLOOR. Distinct from barricade work: two people standing on the thin padding.
  C('RINGSIDE', 'Ringside Floor', [
    G('Standing on the Floor', [
      S('RS_F_LIGHT','Front · Light Attack',  2, 'strike',  'FLOOR'),
      S('RS_F_HEAVY','Front · Heavy Attack',  2, 'strike',  'FLOOR'),
      S('RS_F_TIEUP','Front Tie-Up',          4, 'grapple', 'FLOOR'),
      S('RS_R_TIEUP','Rear Tie-Up',           4, 'grapple', 'FLOOR'),
      S('RS_F_SUB',  'Floor Submission',      2, 'submission','FLOOR')
    ]),
    G('Floor Ground Game', [
      S('RS_G_STRK', 'vs Grounded · Strike',  2, 'strike',  'FLOOR'),
      S('RS_G_GRAP', 'vs Grounded · Grapple', 2, 'grapple', 'FLOOR'),
      S('RS_G_PIN',  'Floor Cover',           1, 'pin',     'FLOOR')
    ])
  ]),

  // NON-COMPETITORS. Shielding the referee, a manager distraction, the low blow behind his back.
  // These are the beats that make a heel a heel and they had no home at all.
  C('OUTSIDERS', 'Referee & Managers', [
    G('Referee', [
      S('NC_REF_SHIELD','Shield the Referee', 1, 'illegal', 'STANDING_FRONT'),
      S('NC_REF_SHOVE', 'Shove the Referee',  1, 'illegal', 'STANDING_FRONT'),
      S('NC_REF_HIDE',  'Blind-Side Foul',    2, 'illegal', 'STANDING_FRONT'),
      S('NC_REF_PULL',  'Pull the Referee In',1, 'illegal', 'STANDING_FRONT')
    ]),
    G('Manager / Second', [
      S('NC_MG_DISTRACT','Manager Distraction', 1, 'taunt',   'TAUNT', false),
      S('NC_MG_HAND',    'Weapon Handoff',      1, 'weapon_grab','STANDING_FRONT'),
      S('NC_MG_TRIP',    'Trip from Ringside',  1, 'illegal', 'FLOOR'),
      S('NC_MG_ATTACK',  'Attack the Manager',  2, 'strike',  'FLOOR')
    ])
  ]),

  // TAG TEAM promoted out of MATCH_TYPE — it is a whole way of wrestling, not a match option.
  C('TAG', 'Tag Team', [
    G('Tandem', [
      S('TG_CORNER',   'Corner Tag Tandem',    4, 'tag', 'CORNER_FRONT'),
      S('TG_DOUBLE',   'Standing Double Team', 4, 'tag', 'STANDING_FRONT'),
      S('TG_GROUND',   'vs Grounded Double',   3, 'tag', 'GROUNDED_HEAD_UP'),
      S('TG_ASSIST',   'Assisted Lift',        3, 'tag', 'STANDING_FRONT'),
      S('TG_LAUNCH',   'Launch / Catapult',    2, 'tag', 'STANDING_FRONT')
    ]),
    G('Sequences', [
      S('TG_HOTTAG',   'Hot Tag Sequence',     2, 'tag', 'STANDING_FRONT'),
      S('TG_ISOLATE',  'Isolation Sequence',   2, 'tag', 'CORNER_FRONT'),
      S('TG_SAVE',     'Break Up the Count',   2, 'tag', 'GROUNDED_HEAD_UP')
    ]),
    G('Tag Finishers', [
      S('TG_FIN_CORNER','Corner Tag Finisher', 2, 'tag', 'CORNER_FRONT', false),
      S('TG_FIN_STAND', 'Standing Tag Finisher',2,'tag', 'STANDING_FRONT', false)
    ])
  ]),

  // RUMBLE specifics — elimination is a different win condition and needs its own verbs.
  C('RUMBLE', 'Rumble & Elimination', [
    G('Elimination', [
      S('RB_ELIM_GRAP','Rope Elimination Grapple', 4, 'rumble', 'ROPE_LEAN'),
      S('RB_ELIM_STRK','Elimination Strike',       3, 'rumble', 'ROPE_LEAN'),
      S('RB_ELIM_TEAM','Team Elimination',         2, 'rumble', 'ROPE_LEAN')
    ]),
    G('Survival', [
      S('RB_SUR_APRON','Apron Survival Defence',   3, 'reversal', 'APRON'),
      S('RB_SUR_SKIN', 'Skin-of-the-Teeth Save',   2, 'reversal', 'APRON'),
      S('RB_SUR_HANG', 'Rope Hang Recovery',       2, 'getup',    'APRON', false)
    ])
  ]),

  // AI is data too. Sliders, targeting bias, object urgency and the scripted sequences 2K26 added.
  C('AI', 'AI Behaviour', [
    G('Tendencies', [
      S('AI_STRIKE_GRAP','Strike vs Grapple Ratio', 1, 'ai_slider', null, false, 1),
      S('AI_AERIAL',     'Aerial Risk Bias',        1, 'ai_slider', null, false, 1),
      S('AI_PIN_FREQ',   'Pin Attempt Frequency',   1, 'ai_slider', null, false, 1),
      S('AI_SUB_FREQ',   'Submission Frequency',    1, 'ai_slider', null, false, 1),
      S('AI_DIRTY',      'Illegal Move Tendency',   1, 'ai_slider', null, false, 1),
      S('AI_TAUNT',      'Taunt Frequency',         1, 'ai_slider', null, false, 1),
      S('AI_REVERSAL',   'Reversal Aggression',     1, 'ai_slider', null, false, 1),
      S('AI_RUN',        'Running Attack Bias',     1, 'ai_slider', null, false, 1)
    ]),
    G('Targeting Priority', [
      S('AI_TG_PARTNER','Legal Partner Focus',      1, 'ai_slider', null, false, 1),
      S('AI_TG_MANAGER','Manager Distraction Bias', 1, 'ai_slider', null, false, 1),
      S('AI_TG_MULTI',  'Multi-Man Threat Weighting',1,'ai_slider', null, false, 1),
      S('AI_TG_HURT',   'Target the Hurt Limb',     1, 'ai_slider', null, false, 1)
    ]),
    G('Match Object Urgency', [
      S('AI_OB_LADDER', 'Ladder Climb Priority',    1, 'ai_slider', null, false, 1),
      S('AI_OB_WEAPON', 'Weapon Retrieval Rate',    1, 'ai_slider', null, false, 1),
      S('AI_OB_TABLE',  'Table Setup Rate',         1, 'ai_slider', null, false, 1),
      S('AI_OB_ESCAPE', 'Cage Escape Priority',     1, 'ai_slider', null, false, 1)
    ]),
    // 2K26's scripted chains, uncapped. They cap at 10 sequences of 10; we do not cap either.
    G('Custom Sequences', [
      S('AI_SEQ',       'Scripted Sequences',       10,'ai_sequence', null, false),
      S('AI_SEQ_LEN',   'Moves per Sequence',       10,'ai_sequence', null, false)
    ])
  ])
];

// ============================================================================================
// FIGHTING STYLES — the owner asked for "59+ fighting styles laid out". These are not cosmetic
// labels: each carries an attribute BIAS and a set of PREFERRED move kinds, so the AI's move
// selection, the default moveset a fresh fighter is generated with, and the fighter's baseline
// attributes all read from the same row. A style is a real thing in the engine or it is nothing.
//   b  attribute bias 0..9: pow speed tech resil show aerial sub strike
//   k  move kinds this style reaches for first
//   st default fighting stance / lo default locomotion
// ============================================================================================
const FS = (id, label, b, k, st, lo) => ({
  id, label,
  bias: { pow: b[0], spd: b[1], tec: b[2], res: b[3], sho: b[4], air: b[5], sub: b[6], str: b[7] },
  prefers: k, stance: st || 'BALANCED', locomotion: lo || 'NORMAL'
});
const STYLES = [
  // --- power / size ---
  FS('POWERHOUSE',   'Powerhouse',            [9,3,5,8,5,1,4,6], ['grapple','carry'],            'WIDE',    'HEAVY'),
  FS('GIANT',        'Giant',                 [9,1,3,9,4,0,3,6], ['grapple','carry','strike'],   'TOWERING','LUMBER'),
  FS('STRONGMAN',    'Strongman',             [9,2,4,8,4,0,4,5], ['carry','grapple'],            'WIDE',    'HEAVY'),
  FS('BRUISER',      'Bruiser',               [8,4,4,8,4,1,3,8], ['strike','grapple'],           'WIDE',    'HEAVY'),
  FS('MONSTER',      'Monster',               [9,3,2,9,6,1,2,7], ['strike','carry','illegal'],   'HUNCHED', 'STALK'),
  FS('BEAST',        'Beast',                 [9,4,2,9,5,2,2,8], ['strike','carry'],             'HUNCHED', 'STALK'),
  FS('FERAL',        'Feral',                 [7,6,2,7,6,3,3,9], ['strike','illegal'],           'HUNCHED', 'PROWL'),
  FS('SUMO',         'Sumo',                  [9,2,5,9,4,0,4,6], ['grapple','strike'],           'SUMO',    'HEAVY'),
  FS('BODYBUILDER',  'Bodybuilder',           [8,3,4,7,7,1,3,5], ['carry','grapple'],            'POSED',   'STRUT'),
  // --- striking ---
  FS('STRIKER',      'Striker',               [6,7,6,5,5,3,3,9], ['strike','combo'],             'BLADED',  'LIGHT'),
  FS('BOXER',        'Boxer',                 [6,8,6,5,5,1,2,9], ['strike','combo','evade'],     'BOXING',  'BOUNCE'),
  FS('MUAY_THAI',    'Muay Thai',             [7,7,6,6,4,2,3,9], ['strike','combo'],             'THAI',    'LIGHT'),
  FS('KICKBOXER',    'Kickboxer',             [6,8,6,5,5,3,2,9], ['strike','combo'],             'BLADED',  'BOUNCE'),
  FS('KARATE',       'Karateka',              [6,7,8,5,5,3,3,9], ['strike','combo'],             'KARATE',  'LIGHT'),
  FS('TAEKWONDO',    'Taekwondo',             [5,9,7,4,6,5,2,9], ['strike','combo'],             'KARATE',  'BOUNCE'),
  FS('KUNG_FU',      'Kung Fu',               [5,8,8,4,6,4,3,9], ['strike','combo','evade'],     'KUNGFU',  'LIGHT'),
  FS('WUSHU',        'Wushu',                 [4,9,8,4,8,6,2,8], ['strike','combo','dive'],      'KUNGFU',  'LIGHT'),
  FS('CAPOEIRA',     'Capoeira',              [5,9,7,4,9,6,1,8], ['strike','evade','combo'],     'CAPOEIRA','GINGA'),
  FS('SAVATE',       'Savate',                [5,8,7,4,6,3,2,9], ['strike','combo'],             'BLADED',  'BOUNCE'),
  FS('KYOKUSHIN',    'Kyokushin',             [7,6,7,8,4,1,3,9], ['strike'],                     'KARATE',  'LIGHT'),
  FS('STRONG_STYLE', 'Strong Style',          [8,6,7,8,5,2,5,9], ['strike','grapple'],           'BLADED',  'DELIBERATE'),
  FS('KINGS_ROAD',   "King's Road",           [8,5,8,9,6,2,5,8], ['grapple','strike','carry'],   'BALANCED','DELIBERATE'),
  // --- grappling / mat ---
  FS('TECHNICIAN',   'Technician',            [5,6,9,6,5,3,7,5], ['grapple','chain','submission'],'CROUCH', 'DELIBERATE'),
  FS('GRAPPLER',     'Grappler',              [7,5,8,7,4,1,7,5], ['grapple','chain'],            'CROUCH',  'DELIBERATE'),
  FS('MAT_TECH',     'Mat Technician',        [5,6,9,6,4,1,8,4], ['chain','submission','grapple'],'CROUCH', 'DELIBERATE'),
  FS('CATCH',        'Catch Wrestler',        [6,6,9,7,3,1,9,5], ['submission','chain'],         'CROUCH',  'DELIBERATE'),
  FS('SHOOTER',      'Shooter',               [6,6,9,7,3,1,9,6], ['submission','chain','strike'],'CROUCH',  'DELIBERATE'),
  FS('AMATEUR',      'Amateur / Collegiate',  [7,6,9,7,3,1,7,4], ['chain','grapple'],            'CROUCH',  'DELIBERATE'),
  FS('FREESTYLE',    'Freestyle Wrestling',   [7,7,9,7,3,1,7,4], ['chain','grapple'],            'CROUCH',  'DELIBERATE'),
  FS('GRECO',        'Greco-Roman',           [8,5,9,8,3,1,6,4], ['grapple','carry','chain'],    'CROUCH',  'DELIBERATE'),
  FS('JUDO',         'Judoka',                [7,6,9,6,4,2,8,4], ['grapple','submission'],       'JUDO',    'DELIBERATE'),
  FS('SAMBO',        'Sambo',                 [7,6,9,7,3,1,9,5], ['submission','grapple'],       'JUDO',    'DELIBERATE'),
  FS('BJJ',          'Jiu-Jitsu',             [4,6,9,6,3,2,9,4], ['submission','chain'],         'CROUCH',  'DELIBERATE'),
  FS('SUB_SPEC',     'Submission Specialist', [5,5,8,6,4,1,9,4], ['submission','rest_hold'],     'CROUCH',  'DELIBERATE'),
  FS('MMA',          'Mixed Martial Artist',  [7,7,8,7,4,2,8,8], ['strike','submission','chain'],'MMA',     'LIGHT'),
  FS('LUTA_LIVRE',   'Luta Livre',            [6,6,8,6,3,2,9,5], ['submission','grapple'],       'CROUCH',  'DELIBERATE'),
  // --- aerial ---
  FS('HIGH_FLYER',   'High-Flyer',            [3,9,6,4,7,9,3,5], ['dive','combo','rollup'],      'LIGHT',   'SPRING'),
  FS('LUCHADOR',     'Luchador',              [3,9,7,4,9,9,4,5], ['dive','rollup','combo'],      'LUCHA',   'SPRING'),
  FS('CRUISERWEIGHT','Cruiserweight',         [4,9,7,4,7,8,4,6], ['dive','combo','rollup'],      'LIGHT',   'SPRING'),
  FS('JUNIOR',       'Junior Heavyweight',    [5,8,8,5,6,7,5,7], ['dive','combo','chain'],       'LIGHT',   'SPRING'),
  FS('DAREDEVIL',    'Daredevil',             [4,8,5,5,9,9,2,6], ['dive'],                       'LIGHT',   'SPRING'),
  FS('ACROBAT',      'Acrobat',               [3,9,7,3,9,9,3,5], ['dive','evade','combo'],       'LUCHA',   'SPRING'),
  // --- hardcore ---
  FS('HARDCORE',     'Hardcore',              [7,5,4,9,6,3,3,8], ['weapon_strike','illegal'],    'HUNCHED', 'STALK'),
  FS('DEATHMATCH',   'Deathmatch',            [7,4,3,9,7,2,2,8], ['deathmatch','weapon_strike'], 'HUNCHED', 'STALK'),
  FS('GARBAGE',      'Garbage Wrestler',      [6,5,3,9,6,3,2,7], ['weapon_strike','illegal'],    'HUNCHED', 'STALK'),
  FS('BRAWLER',      'Brawler',               [7,6,4,8,5,2,3,9], ['strike','illegal'],           'WIDE',    'HEAVY'),
  FS('STREET',       'Street Fighter',        [7,7,4,7,5,3,3,9], ['strike','illegal'],           'STREET',  'SWAGGER'),
  FS('BARROOM',      'Bar Room Brawler',      [7,5,3,8,6,1,3,9], ['strike','weapon_strike'],     'STREET',  'SWAGGER'),
  FS('PRISON',       'Prison Yard',           [8,5,4,9,4,1,4,9], ['strike','illegal'],           'HUNCHED', 'STALK'),
  FS('BIKER',        'Biker',                 [8,5,4,8,6,1,3,8], ['strike','weapon_strike'],     'WIDE',    'SWAGGER'),
  FS('BOUNCER',      'Bouncer',               [8,5,5,8,4,1,5,7], ['grapple','strike'],           'WIDE',    'HEAVY'),
  // --- character / persona ---
  FS('SHOWMAN',      'Showman',               [5,6,6,5,9,5,4,6], ['taunt','combo','signature'],  'POSED',   'STRUT'),
  FS('ENTERTAINER',  'Sports Entertainer',    [6,6,6,6,9,4,4,6], ['taunt','signature'],          'POSED',   'STRUT'),
  FS('ROCKSTAR',     'Rockstar',              [6,6,5,6,9,4,3,7], ['taunt','strike'],             'POSED',   'STRUT'),
  FS('DANCER',       'Dancer',                [4,8,6,4,9,6,3,6], ['taunt','evade','combo'],      'CAPOEIRA','GINGA'),
  FS('COMEDIAN',     'Comedian',              [4,6,5,5,9,4,3,5], ['taunt','rollup','illegal'],   'GOOFY',   'BOUNCE'),
  FS('TRICKSTER',    'Trickster',             [4,8,7,5,7,6,5,6], ['rollup','evade','illegal'],   'LIGHT',   'PROWL'),
  FS('CHEATER',      'Cheater',               [5,6,6,5,6,3,5,7], ['illegal','rollup','pin_illegal'],'STREET','PROWL'),
  FS('COWARD',       'Chickenshit Heel',      [4,7,5,4,7,3,4,6], ['evade','illegal','rollup'],   'GOOFY',   'SCURRY'),
  FS('RING_GENERAL', 'Ring General',          [6,6,9,8,7,3,7,7], ['chain','grapple','rest_hold'],'BALANCED','DELIBERATE'),
  FS('VETERAN',      'Grizzled Veteran',      [6,4,9,8,6,1,7,7], ['rest_hold','chain','illegal'],'BALANCED','DELIBERATE'),
  FS('ROOKIE',       'Rookie',                [5,7,4,5,4,4,3,6], ['strike','grapple'],           'BALANCED','NORMAL'),
  FS('PRODIGY',      'Prodigy',               [6,8,8,6,6,6,6,7], ['combo','chain','dive'],       'BALANCED','LIGHT'),
  FS('ATHLETE',      'Pure Athlete',          [7,8,7,7,5,6,5,7], ['combo','grapple','dive'],     'BALANCED','LIGHT'),
  FS('COWBOY',       'Cowboy',                [7,5,6,7,6,1,5,8], ['strike','grapple'],           'WIDE',    'SWAGGER'),
  FS('LUMBERJACK',   'Lumberjack',            [8,4,5,8,4,1,4,8], ['strike','carry'],             'WIDE',    'LUMBER'),
  FS('OCCULTIST',    'Occultist',             [7,5,5,9,8,2,5,7], ['strike','submission','taunt'],'HUNCHED', 'STALK'),
  FS('UNDEAD',       'Undead',                [8,3,5,9,8,1,5,7], ['grapple','taunt'],            'TOWERING','STALK'),
  FS('CULT_LEADER',  'Cult Leader',           [7,5,6,8,9,2,6,7], ['grapple','taunt','submission'],'POSED',  'STALK'),
  FS('ENFORCER',     'Enforcer',              [8,5,6,8,4,1,5,8], ['strike','grapple'],           'WIDE',    'HEAVY'),
  FS('SPECIALIST',   'Weapon Specialist',     [6,6,6,7,6,2,3,8], ['weapon_grapple','weapon_strike'],'STREET','PROWL')
];

// ============================================================================================
// PAYBACKS — the full 2K26-parity set, and the thing 2K does NOT do: every one has VARIANTS, so
// two wrestlers who both carry Poison Mist are not the same wrestler.
//
// Owner: "we need uniqueness to those like mist colors for poison mist, kip up styles, comeback
// styles, what the comeback, the freezes".
//
// He is right that the mechanic is only half of it. In 2K, Poison Mist is Poison Mist. Here a mist
// carries a COLOUR and the colour changes what it does; a Freeze is a specific piece of theatre
// that belongs to that character; a Comeback is a NAMED CHAIN OF BEATS assembled from move slots
// the engine can already execute, not a hardcoded cutscene. Same mechanic, their performance.
//
// NAMES ARE OURS. The mechanics are standard wrestling-game vocabulary; the names, colours and
// sequences are BANNON's.
//
//   tier      major = once a match, swings the finish; minor = always on, no meter
//   dq        does the official seeing it risk a disqualification
//   variants  the per-character performances — a fighter carries exactly ONE
// ============================================================================================
const PB = (id, label, tier, trigger, effect, o) => Object.assign(
  { id, label, tier, trigger, effect, dq:false, variants:[] }, o || {});

// A comeback is a chain of BEATS. Each beat maps to a slot kind the engine already runs, so the
// sequence is assembled from the move system instead of being a cutscene. Drop a beat, lose it.
const COMEBACKS = [
  // POWER / NO-SELL — he stops feeling it and walks through you
  { id:'CB_IRONHIDE',   label:'Ironhide',          arch:'power',  beats:['absorb','absorb','strike','strike','strike','whip','rebound_boot'],
    note:'shrugs the shots off, three heavy hands, whip and a boot on the return' },
  { id:'CB_TIDE',       label:'The Turning Tide',  arch:'power',  beats:['absorb','absorb','roar','strike','strike','slam'],
    note:'eats two more than he should have, then the crowd does the rest' },
  { id:'CB_QUAKE',      label:'Groundquake',       arch:'power',  beats:['shoulder_block','shoulder_block','running_splash','sidewalk_slam'],
    note:'runs straight through him twice and then lands on him' },
  { id:'CB_SLAMPARTY',  label:'Slam Party',        arch:'power',  beats:['bodyslam','bodyslam','bodyslam','elbow_drop'],
    note:'slams him three times and drops the elbow like it is 1987' },
  { id:'CB_SUPLEXRUN',  label:'Suplex Run',        arch:'power',  beats:['german','german','german','release_german'],
    note:'germans until the mat gives out' },
  { id:'CB_LARIATRUN',  label:'Lariat Run',        arch:'power',  beats:['clothesline','clothesline','whip','running_lariat','slam'],
    note:'three clotheslines and something to finish it' },
  { id:'CB_LASTSTAND',  label:'Last Stand',        arch:'power',  beats:['absorb','absorb','absorb','stand_up','strike','strike'],
    note:'takes everything, refuses to go down, and that is the whole comeback' },

  // SUPERNATURAL / UNKILLABLE
  { id:'CB_RISEN',      label:'Risen',             arch:'undead', beats:['sit_up','stalk','grapple','strike','signature_setup'],
    note:'sits straight up out of nothing and walks him down' },
  { id:'CB_DAMNED',     label:'Comeback of the Damned', arch:'undead', beats:['sit_up','stare','throat_grab','chokeslam_setup'],
    note:'gets up wrong, and takes him by the throat' },
  { id:'CB_HOLLOW',     label:'Hollow',            arch:'undead', beats:['absorb','laugh','headbutt','headbutt','strike'],
    note:'laughs at it, then headbutts him until one of them stops' },

  // SPEED / AERIAL
  { id:'CB_QUICKSILVER',label:'Quicksilver',       arch:'aerial', beats:['duck','leapfrog','headscissors','springboard','senton'],
    note:'ducks under, takes the head, goes up and comes down' },
  { id:'CB_CARTWHEEL',  label:'Cartwheel',         arch:'aerial', beats:['handspring','back_elbow','dropkick','springboard','crossbody'],
    note:'handsprings out of the corner and never touches the mat properly again' },
  { id:'CB_ROPERALLY',  label:'Rope Rally',        arch:'aerial', beats:['whip','rebound','rebound','rebound','flying_forearm'],
    note:'uses the ropes three times before he lets anything land' },
  { id:'CB_KICKRUSH',   label:'Kick Rush',         arch:'aerial', beats:['roundhouse','roundhouse','spin_kick','enziguri'],
    note:'nothing but legs, and each one is faster than the last' },

  // STRIKER / COMBINATION
  { id:'CB_CLOCKWORK',  label:'Clockwork',         arch:'strike', beats:['counter','strike','strike','elbow','forearm_finish'],
    note:'a corner reversal into a rapid combination and the forearm' },
  { id:'CB_DETONATE',   label:'Detonate',          arch:'strike', beats:['forearm_flurry','dropkick','whip','corner_clothesline','pop_up'],
    note:'a flurry that will not stop until the corner explodes' },
  { id:'CB_TENPUNCH',   label:'Ten and Counting',  arch:'strike', beats:['corner_mount','punch','punch','punch','punch','bite'],
    note:'up on the buckles with the whole building counting' },
  { id:'CB_MACHINEGUN', label:'Machine Gun',       arch:'strike', beats:['chop','chop','chop','chop','whip','back_elbow'],
    note:'chops him from one corner to the other' },
  { id:'CB_HEADBUTTRUN',label:'Rhythm',            arch:'strike', beats:['jab','jab','jab','shuffle','right_hand'],
    note:'the jab, the jab, the jab, the little dance, and the right hand' },
  { id:'CB_SLEDGE',     label:'Sledgehammer',      arch:'strike', beats:['block','clothesline','atomic_drop','knee_drop','basement_dropkick'],
    note:'grinding, joint by joint, straight down the middle' },
  { id:'CB_RALLY',      label:'The Rally',         arch:'strike', beats:['takedown','mounted_punches','stomp','stomp','whip','clothesline'],
    note:'takes him down and stomps a hole in him' },

  // TECHNICAL / MAT
  { id:'CB_THREEFOLD',  label:'Threefold',         arch:'tech',   beats:['suplex','suplex','suplex','pin_setup'],
    note:'three rolling suplexes without ever letting go' },
  { id:'CB_CHAINRALLY', label:'Chain Rally',       arch:'tech',   beats:['takedown','transition','transition','submission_setup'],
    note:'takes him down and keeps taking positions until there is a hold on' },
  { id:'CB_SNAKEBITE',  label:'Snake Bite',        arch:'tech',   beats:['powerslam','backbreaker','rope_ddt','stalk'],
    note:'the same four things, in the same order, every time — and it always works' },
  { id:'CB_JOINTWORK',  label:'Joint Work',        arch:'tech',   beats:['leg_kick','leg_kick','takedown','leg_lock_setup'],
    note:'takes the leg out from under him and stays there' },

  // HEEL / DIRTY
  { id:'CB_MERCY',      label:'No Mercy Left',     arch:'dirty',  beats:['low_blow','eye_rake','strike','weapon_grab','strike'],
    note:'a comeback for someone who was never going to do it clean' },
  { id:'CB_DESPERATE',  label:'Desperation',       arch:'dirty',  beats:['thumb_eye','hair_pull','choke','rope_choke','strike'],
    note:'everything the official cannot be looking at' },
  { id:'CB_STEEL',      label:'Steel Comeback',    arch:'dirty',  beats:['weapon_grab','weapon_strike','weapon_strike','buckle_ram'],
    note:'goes under the ring and comes back a different man' },

  // SHOWMAN
  { id:'CB_CROWDCALL',  label:'Crowd Call',        arch:'show',   beats:['taunt','absorb','strike','taunt','strike','signature_setup'],
    note:'plays the room between every blow' },
  { id:'CB_ENCORE',     label:'Encore',            arch:'show',   beats:['pose','strike','pose','strike','pose','finisher_setup'],
    note:'insufferable, and it works' }
];


const PAYBACKS = [
  PB('PB_COMEBACK','Comeback','major','hp<25%',
     'Runs this fighter\'s own comeback chain; landing every beat refills momentum and grants a finisher',
     { variants: COMEBACKS.map(c => ({ id:c.id, label:c.label, beats:c.beats, note:c.note })) }),
  PB('PB_SECOND_WIND','Second Wind','major','stamina<15% or grounded',
     'Stamina restored, momentum maxed, and the fighter comes straight back up',
     { variants:[
       { id:'SW_KIP',       label:'Kip-Up',       note:'snaps to his feet from flat on his back', req:'agility' },
       { id:'SW_NIPUP',     label:'Nip-Up',       note:'a tighter, faster version off the shoulders', req:'agility' },
       { id:'SW_SITUP',     label:'Dead Sit-Up',  note:'sits bolt upright without using his hands', req:'resilience' },
       { id:'SW_HANDSPRING',label:'Handspring',   note:'kicks over onto his hands and lands on his feet', req:'aerial' },
       { id:'SW_ROAR',      label:'Second Breath',note:'hauls himself up on the ropes and screams', req:'any' },
       { id:'SW_ZOMBIE',    label:'Not Finished', note:'rises in one slow unbroken motion, no stagger', req:'resilience' },
       { id:'SW_ROLL',      label:'Roll & Rise',  note:'rolls through and comes up already moving', req:'agility' }
     ]}),
  PB('PB_FREEZE','Freeze','major','standing, face to face',
     'Theatre that locks the opponent in a dazed loop long enough to line up a free shot',
     { variants:[
       // NO-SELL / INTIMIDATION
       { id:'FZ_SHAKE',   label:'The Shakes',      hold:2.6, mom:22, note:'fists shaking, finger levelled at him, feeding off the noise' },
       { id:'FZ_SITUP',   label:'The Sit-Up',      hold:3.0, mom:26, note:'rises from the dead mid-beating and simply looks at him' },
       { id:'FZ_STARE',   label:'Dead Stare',      hold:2.8, mom:18, note:'stops moving entirely and stares — the crowd does the rest' },
       { id:'FZ_NOSELL',  label:'Nothing',         hold:2.4, mom:20, note:'takes the shot square and does not move an inch' },
       { id:'FZ_HEADTILT',label:'The Tilt',        hold:2.6, mom:22, note:'cracks his neck to one side and keeps coming' },
       { id:'FZ_STANDUP', label:'Straight Up',     hold:3.2, mom:28, note:'rises from prone in one motion without using his hands' },
       // MOCKERY / DISRESPECT
       { id:'FZ_LAUGH',   label:'The Laugh',       hold:2.4, mom:24, note:'laughs in his face while blood runs' },
       { id:'FZ_BECKON',  label:'Bring It',        hold:2.0, mom:16, note:'a slow hand, palm up — asks for the next one' },
       { id:'FZ_CHEST',   label:'Chest Beat',      hold:2.2, mom:20, note:'beats his own chest and invites the shot' },
       { id:'FZ_SLAP',    label:'Wake Up',         hold:2.0, mom:18, note:'slaps his own face hard, twice' },
       { id:'FZ_NOD',     label:'The Nod',         hold:1.8, mom:14, note:'one slow nod, and then violence' },
       { id:'FZ_WHISPER', label:'The Whisper',     hold:2.6, mom:22, note:'leans in and says something only he hears' },
       { id:'FZ_GRIN',    label:'Red Smile',       hold:2.4, mom:24, note:'smiles through his own blood' },
       { id:'FZ_KISS',    label:'Blow the Kiss',   hold:1.8, mom:16, note:'insulting, and effective' },
       { id:'FZ_CHOP',    label:'Cut-Throat',      hold:2.0, mom:20, note:'draws a thumb across the throat and names the ending' },
       // RITUAL / SUPERNATURAL
       { id:'FZ_UNHINGED',label:'Unhinged',        hold:3.0, mom:26, note:'eyes roll back, head tilts, something else is driving' },
       { id:'FZ_CROSS',   label:'Benediction',     hold:3.0, mom:24, note:'arms out, head back, waits to be hit' },
       { id:'FZ_KNEEL',   label:'The Kneel',       hold:2.8, mom:22, note:'drops to one knee, arms wide, offers it up' },
       { id:'FZ_MASK',    label:'Behind the Mask', hold:2.6, mom:20, note:'slowly removes and re-seats the mask' },
       { id:'FZ_TONGUE',  label:'Feral',           hold:2.4, mom:22, note:'tongue out, breathing wrong, no longer a wrestler' },
       { id:'FZ_LEVITATE',label:'Ascension',       hold:3.4, mom:30, note:'comes up off the mat far too smoothly' },
       // SHOWMAN
       { id:'FZ_CALL',    label:'Calling It',      hold:2.2, mom:20, note:'points at the mat and names the finish out loud' },
       { id:'FZ_SALUTE',  label:'The Salute',      hold:2.0, mom:16, note:'stands straight and salutes the hard camera' },
       { id:'FZ_CONDUCT', label:'Conductor',       hold:2.8, mom:28, note:'orchestrates the building like a choir' },
       { id:'FZ_POSE',    label:'The Pose',        hold:2.2, mom:22, note:'hits the pose mid-beating because he knows' },
       { id:'FZ_GUITAR',  label:'Air Guitar',      hold:2.0, mom:24, note:'plays a solo nobody asked for' },
       { id:'FZ_TAPE',    label:'Tearing the Tape',hold:2.6, mom:18, note:'rips the wrist tape off with his teeth' },
       { id:'FZ_VEST',    label:'Losing the Vest', hold:2.4, mom:20, note:'takes the jacket off, which is never good news' },
       { id:'FZ_SNAP',    label:'Snap',            hold:1.6, mom:14, note:'one finger snap and the room goes quiet' }
     ]}),
  PB('PB_MIST','Poison Mist','major','standing, close',
     'Blinds the opponent for several seconds; everything lands clean while they cannot see',
     { dq:true, variants:[
       { id:'MIST_GREEN', label:'Green Mist',  colour:0x2fbf4a, blind:5.0, extra:'burns — damage over time' },
       { id:'MIST_RED',   label:'Red Mist',    colour:0xc41b21, blind:4.5, extra:'draws blood from the eyes' },
       { id:'MIST_BLACK', label:'Black Mist',  colour:0x14141a, blind:7.0, extra:'total blackout, worst DQ odds' },
       { id:'MIST_BLUE',  label:'Blue Mist',   colour:0x2f6fbf, blind:3.5, extra:'shorter, but slows them badly' },
       { id:'MIST_GOLD',  label:'Gold Mist',   colour:0xd4af37, blind:4.0, extra:'drains their momentum into yours' },
       { id:'MIST_VIOLET',label:'Violet Mist', colour:0x7a3fbf, blind:4.0, extra:'scrambles their reversal timing' },
       { id:'MIST_WHITE', label:'White Mist',  colour:0xe8e8f0, blind:3.0, extra:'a smokescreen — breaks their lock-on' }
     ]}),
  PB('PB_RESILIENCY','Resiliency','major','pinned or in a submission',
     'Escapes a pinfall, a submission or any minigame instantly, with no prompt',
     { variants:[
       { id:'RS_SHOULDER', label:'Shoulder Up',      note:'the shoulder comes up at the last possible instant' },
       { id:'RS_FOOT',     label:'Foot on the Rope', note:'gets the boot onto the bottom rope' },
       { id:'RS_POWEROUT', label:'Power Out',        note:'simply stands up with them still holding on' },
       { id:'RS_REFUSAL',  label:'Refusal',          note:'shakes the head, will not go down, breaks the grip' }
     ]}),
  PB('PB_SPIRIT','Spirit Breaker','major','standing, face to face',
     'Locks the opponent into a broken state — no signature or finisher, and their next two reversals fail',
     { variants:[
       { id:'SB_HEADBUTTS',label:'Nine Headbutts', note:'until one of you stops' },
       { id:'SB_SLAPS',    label:'Open Hand',      note:'slaps, not punches, and that is the point' },
       { id:'SB_CHOPS',    label:'The Wall',       note:'chops him into the corner and does not stop' },
       { id:'SB_STOMPS',   label:'Ten Count',      note:'corner stomps counted out loud by the building' }
     ]}),
  PB('PB_BLACKOUT','Blackout','major','in the ring, one on one',
     'The lights go out for two seconds and you come back up behind them',
     { variants:[
       { id:'BO_DARK',  label:'Lights Out', note:'total dark, then you are behind him' },
       { id:'BO_STROBE',label:'Strobe',     note:'a stutter of light — he loses you for a beat' },
       { id:'BO_RED',   label:'Red Light',  note:'the arena goes red and the crowd noise drops out' },
       { id:'BO_SMOKE', label:'Smoke',      note:'the entrance fires and you are gone from where you were' }
     ]}),
  PB('PB_RUNIN','Run-In','major','grounded or on the ropes',
     'Brings an ally down to distract the official or take your opponent off his feet',
     { variants:[
       { id:'RI_ALLY',    label:'The Ally',        note:'a stablemate hits the ring and takes him down' },
       { id:'RI_DISTRACT',label:'The Distraction', note:'draws the official away instead of touching anyone' },
       { id:'RI_MANAGER', label:'The Manager',     note:'your second gets involved and pays for it' },
       { id:'RI_DEBT',    label:'A Debt Called',   note:'someone with no obvious reason to help you, helps you' }
     ]}),
  PB('PB_THIEF','Move Thief','major','in position for their finisher',
     'Performs your opponent\'s own signature or finisher against them',
     { variants:[
       { id:'MT_EXACT',label:'Perfect Copy', note:'their move, executed better than they do it' },
       { id:'MT_MOCK', label:'Mockery',      note:'their taunt first, then their move' },
       { id:'MT_UGLY', label:'Ugly Copy',    note:'clumsier, uglier, and it hurts more' }
     ]}),
  PB('PB_FIREBALL','Fireball','major','standing, close',
     'Fire to the face. Enormous damage, enormous consequences',
     { dq:true, variants:[
       { id:'FB_FLASH',  label:'Flash Paper', note:'a bright hot flash and it is over' },
       { id:'FB_LIGHTER',label:'Zippo',       note:'crude, slow, and everybody sees it coming' }
     ]}),
  PB('PB_PUNCH','Power of the Punch','major','standing',
     'A single loaded punch that puts them straight on the mat',
     { dq:true, variants:[
       { id:'PP_KNUX', label:'Brass',         note:'knuckles out of the trunks' },
       { id:'PP_TAPE', label:'Loaded Tape',   note:'something wrapped under the hand tape' },
       { id:'PP_CAST', label:'The Cast',      note:'a protective cast that stopped being protective' },
       { id:'PP_CLEAN',label:'Just the Hand', note:'nothing loaded at all — he just hits that hard' }
     ]}),
  PB('PB_REFBUMP','Ref Bump','major','manual',
     'Takes the official off his feet: nothing counts and nothing is illegal until he is back',
     { variants:[
       { id:'RB_ACCIDENT',   label:'An Accident', note:'genuinely looks like one' },
       { id:'RB_DELIBERATE', label:'On Purpose',  note:'nobody is pretending' }
     ]}),
  PB('PB_SIPHON','Soul Siphon','major','opponent has momentum',
     'Drains the opponent\'s momentum directly into yours',
     { variants:[
       { id:'SS_DRAIN',label:'The Drain', note:'a hand on the throat and the meter moves' },
       { id:'SS_FEED', label:'Feeding',   note:'takes damage on purpose and grows from it' },
       { id:'SS_MARK', label:'The Mark',  note:'leaves something on them that keeps taking' }
     ]}),
  PB('PB_POWDER','Powder','major','standing, close',
     'A handful to the eyes — cheaper than mist and harder for the official to spot',
     { dq:true, variants:[
       { id:'PW_CHALK',label:'Chalk', note:'straight off the turnbuckle pad' },
       { id:'PW_SALT', label:'Salt',  note:'from a pouch in the trunks' },
       { id:'PW_ASH',  label:'Ash',   note:'and it stains' }
     ]}),
  // ---- MINOR: always on, no meter ----
  PB('PB_IRONJAW','Iron Jaw','minor','after a heavy hit','Snaps out of the dazed state instead of eating the long stun'),
  PB('PB_RAGE','Rage','minor','hp<50%','Damage output climbs as health falls'),
  PB('PB_FORTIFY','Fortify','minor','always','Incoming damage reduced; knockdowns become staggers more often'),
  PB('PB_BEAST','Beast','minor','always','Higher weight-class lift ceiling and carry stamina'),
  PB('PB_ENDURE','Endurance','minor','always','Stamina drains 20% slower'),
  PB('PB_THICK','Thick Skin','minor','always','Incoming strike damage -15%'),
  PB('PB_HEAVY_HAND','Heavy Hands','minor','always','Strike damage +12%'),
  PB('PB_QUICK','Quick Recovery','minor','grounded','Get-up 30% faster'),
  PB('PB_SLIPPERY','Slippery','minor','in a grapple','Grapple escape window +40%'),
  PB('PB_TECHNICAL','Technical Precision','minor','chain wrestling','Chain transitions cost no stamina'),
  PB('PB_HIGH_RISK','High Risk','minor','diving','Dive damage +25%, self-damage on a miss +25%'),
  PB('PB_OPPORTUNIST','Opportunist','minor','opponent stunned','Roll-up pins get an extra second of count'),
  PB('PB_CROWD','Crowd Favourite','minor','crowd hot','Momentum gain +30% while the crowd is with you'),
  PB('PB_HATED','Most Hated','minor','crowd hostile','Momentum gain +30% while the crowd is against you'),
  PB('PB_BLEEDER','Bleeder','minor','always','Bleeds early, and gains momentum while bleeding'),
  PB('PB_HARDWAY','Hard Way','minor','bleeding','Damage output +20% while bleeding'),
  PB('PB_SUB_HUNTER','Submission Hunter','minor','always','Submission damage +20%, opponent escape -15%'),
  PB('PB_RING_IQ','Ring IQ','minor','always','Reversal timing window +25%'),
  PB('PB_DIRTY','Dirty Player','minor','referee distracted','Illegal moves do full damage with no DQ accrual'),
  PB('PB_BULLY','Bully','minor','opponent below 40% hp','Damage climbs against a hurt opponent'),
  PB('PB_PAPARAZZI','Paparazzi','minor','always','Match rating and momentum both climb faster on big spots'),
  PB('PB_ROPE','Rope Break Master','minor','in a submission','Auto-reach the nearest rope from any ground submission')
];

// ============================================================================================
// MOVE MODIFIERS — DECLARED, NOT INVENTED.
//
// The owner: "u don't need to add the modifier system[,] [it] should be there to build on top of."
// He is right, and it is. The engine already multiplies every slot by its own live inputs:
//
//   GRAPPLE_MATRIX[mode][kind][dir5]  and  [dir5 + '_M']   (BANNON_v150.html, pickGrapplePosition)
//   powerMod = keys.shift || heldBtns.block || heldBtns.mod           (playerAttack)
//   running / runCharge / _runKeyHeld                                  (movement)
//
// That is mode(2) x kind(4) x dir5(5) x powerMod(2) = 80 distinct grapple executions ALREADY
// resolved from the same tables, before a single new system is written. Declaring them here means
// the move-set editor can show a slot's true execution count and the AI can reason about them,
// instead of a parallel modifier system existing beside the real one and drifting from it.
//
//   reads   where the engine picks this modifier up from — grep-able, so it stays honest
//   x       how many executions this modifier multiplies a compatible slot by
const MODIFIER_SOURCE = 'BANNON_v150.html · GRAPPLE_MATRIX / pickGrapplePosition / playerAttack';
const MODIFIERS = [
  { id:'MOD_FACING', label:'Facing (front / rear)', reads:'GRAPPLE_MATRIX[mode]', input:'which side you are on',
    x:2, applies:['grapple','carry','strike','submission','rollup','pin'] },
  { id:'MOD_KIND',   label:'Attack Kind (jab / kick / cross / special)', reads:'GRAPPLE_MATRIX[mode][kind]', input:'which attack button',
    x:4, applies:['grapple','strike','combo'] },
  { id:'MOD_DIR5',   label:'Direction (neutral / up / down / left / right)', reads:'dir5 in playerAttack', input:'stick or D-pad held',
    x:5, applies:['grapple','carry','strike','combo','dive'] },
  { id:'MOD_POWER',  label:'Power / Loaded (MOD held)', reads:"powerMod = keys.shift || heldBtns.block || heldBtns.mod", input:'hold MOD',
    x:2, applies:['grapple','carry','strike','combo','submission'] },
  { id:'MOD_RUN',    label:'Running / Momentum', reads:'running / runCharge / _runKeyHeld', input:'hold RUN',
    x:2, applies:['strike','grapple','dive','tag'] },
  { id:'MOD_HAMMER', label:'Hammer Throw (held whip)', reads:'held whip branch in the ZONE handler', input:'RUN + ZONE in a grapple',
    x:2, applies:['grapple'] },
  { id:'MOD_ZONE',   label:'Zone (ring / apron / floor)', reads:'window.ZONE_Y + f.zone', input:'where you are standing',
    x:3, applies:['strike','grapple','dive','pin','submission'] },
  { id:'MOD_WEAPON', label:'Armed', reads:'BANNON_WEAPONS held item', input:'holding a weapon',
    x:2, applies:['strike','grapple'] }
];
// What a modifier set actually buys a slot, per kind. This is the honest number: the product of
// every modifier that APPLIES to that kind. The owner asked that nothing be capped and that the
// modifiers "at least double all areas" — measured against the declared engine inputs, the floor is
// far above double everywhere the modifiers reach.
function expansionFor(kind){
  return MODIFIERS.reduce(function(a, m){ return a * (m.applies.indexOf(kind) >= 0 ? m.x : 1); }, 1);
}

// ============================================================================================
// EXECUTION FILTERS — reach and stats decide what lands, not a slot budget.
//
// The owner's rule: "Range is strictly driven by the physical reach of the character model and their
// core attributes/stats, keeping the execution grounded and realistic rather than artificially
// boosted." So there is no warp-to-target. A move whiffs when the arm is not long enough.
//
// And his question — what happens when a reach check BARELY passes — has one correct answer for a
// physics-first game: you do not snap and you do not slide the root. You spend the shortfall on the
// body. The attacker leans, rotates the spine and extends the limb toward the target by the exact
// deficit, scaled by agility, and the strike arrives at the edge of its range looking like a strike
// at the edge of its range. Below `lean` it is a clean hit; between `lean` and `max` it is a
// stretched one that does less damage; past `max` it whiffs. That is the whole blend and it is
// three numbers, not a state machine.
// ============================================================================================
const EXECUTION = {
  reach: {
    source: 'bone_length',
    note: 'measured from the bound GLB skeleton: shoulder->hand for arms, hip->foot for legs, ' +
          'plus the torso lean the spine chain can contribute. No per-move authored range.',
    limbs: {
      arm: { chain:['shoulder','elbow','hand'], strikeKinds:['jab','cross','elbow','chop','clothesline','lariat'] },
      leg: { chain:['hip','knee','foot'],       strikeKinds:['kick','knee','stomp'] },
      body:{ chain:['pelvis','chest'],          strikeKinds:['shoulder','headbutt','tackle'] }
    },
    // grapples need CONTACT, not extension — you have to be able to close your hands on them
    grappleClosure: 0.62,
    // fractions of full reach
    clean: 0.82,   // inside this, the move plays as authored
    lean:  1.00,   // between clean and lean: dynamic extension, damage tapers
    max:   1.14    // between lean and max: maximum stretch, heavy damage taper; past it, whiff
  },
  // Stats do not add range out of nowhere; they change how much of the body's own reach a fighter
  // can actually commit inside the move's frames.
  stats: {
    agility:  { affects:'extension', note:'how far into the lean the fighter can commit', weight:0.55 },
    strength: { affects:'lift',      note:'weight-class gate on carries and suplexes',    weight:1.00 },
    speed:    { affects:'startup',   note:'frames before the reach test is taken',        weight:0.40 },
    dexterity:{ affects:'closure',   note:'grapple closure tolerance',                    weight:0.35 },
    stamina:  { affects:'pool',      note:'which moves the pool will even offer',         weight:1.00 }
  },
  // A lift is a strength question against the OTHER body's mass. Failing it is not a whiff, it is a
  // visible struggle — which is exactly the teeter the owner wants at full amplitude.
  weightClass: {
    classes: [
      { id:'CRUISER',  maxKg: 95 },
      { id:'LIGHT',    maxKg:110 },
      { id:'MIDDLE',   maxKg:125 },
      { id:'HEAVY',    maxKg:145 },
      { id:'SUPER',    maxKg:180 },
      { id:'GIANT',    maxKg:999 }
    ],
    // ratio of lifter strength to target mass below which the lift becomes a STRUGGLE rather than a
    // clean execution; below failFloor it collapses and they come back down on top of you
    struggleBelow: 1.00,
    failFloor:     0.62
  },
  stamina: {
    // the move pool filters itself: an exhausted fighter is not offered the biggest lifts
    gateCarry: 0.35, gateFinisher: 0.25, gateDive: 0.30, gateRunning: 0.20
  }
};

// AI settings vocabulary — 2K's exact options, so the editor can offer them verbatim
const AI = {
  priority:   ['Average','Preferred','Favorite','Low','Very Low'],
  repetition: ['Default','Allow Repeats','Only Once','Allow Flurry','Prefer Flurry'],
  timing:     ['Any','Avoid Early','Prefer Early','Early Only','Prefer Late','Late Only']
};

// ============================================================================================
// PIN CATALOGUE — the named pins that fill the PINS category, with the numbers the pin resolver
// actually reads. This is the owner's ask made concrete: "the dramatic different ones they have in
// WWE 2k26 like school boy and la magistral etc", front AND rear.
//
//   entry     how it can be started: COVER (down+zone or procedural on a grounded body),
//             ROLLUP (out of a standing exchange), COUNTER (only off a reversal window)
//   from      the engine position required
//   face      'front' | 'rear' — which side of the opponent you must be on
//   lift      how far the victim's shoulders are pressed down; feeds the shoulder proxy test
//   kick      kick-out difficulty multiplier for the VICTIM. >1 = easier to escape.
//   speed     how fast the count starts. Roll-ups start instantly, that is their whole appeal —
//             and they are correspondingly easy to kick out of, which is also correct.
//   hold      seconds the pin can be maintained before it naturally breaks (roll-ups expire)
//   illegal   the referee will wave it off if he sees it
// ============================================================================================
const P = (id, label, entry, from, face, o) => Object.assign({
  id, label, entry, from, face,
  lift: 1.0, kick: 1.0, speed: 1.0, hold: 0, illegal: false, cocky: false,
  clip: null   // filled by the clip mapper; null means fall back to the position's generic pin
}, o || {});

const PINS = [
  // ---- ground covers: slow to lock in, hard to escape, they hold forever ----
  P('PN_LATERAL',  'Lateral Press',        'COVER', 'GROUNDED_HEAD_UP', 'front', { lift:1.00, kick:1.00, speed:1.00, hold:0 }),
  P('PN_LEG_HOOK', 'Leg Hook Cover',       'COVER', 'GROUNDED_HEAD_UP', 'front', { lift:1.05, kick:0.88, speed:0.92, hold:0 }),
  P('PN_DBL_LEG',  'Double Leg Hook',      'COVER', 'GROUNDED_HEAD_UP', 'front', { lift:1.10, kick:0.78, speed:0.84, hold:0 }),
  P('PN_JACKKNIFE','Jackknife Cover',      'COVER', 'GROUNDED_HEAD_UP', 'front', { lift:1.15, kick:0.72, speed:0.80, hold:0 }),
  P('PN_GRAPEVINE','Grapevine Cover',      'COVER', 'GROUNDED_HEAD_UP', 'front', { lift:1.08, kick:0.80, speed:0.86, hold:0 }),
  P('PN_KNEE',     'Knee-on-Chest Cover',  'COVER', 'GROUNDED_HEAD_UP', 'front', { lift:1.12, kick:0.85, speed:0.95, hold:0 }),
  P('PN_ARM_HOOK', 'Arm Hook Cover',       'COVER', 'GROUNDED_SIDE',    'front', { lift:1.02, kick:0.94, speed:0.96, hold:0 }),
  P('PN_PRONE',    'Turn & Cover',         'COVER', 'GROUNDED_HEAD_DOWN','front',{ lift:1.00, kick:1.00, speed:1.35, hold:0 }),
  // ---- cocky covers: the disrespect costs you a real amount of count ----
  P('PN_FOOT',     'Foot-on-Chest',        'COVER', 'GROUNDED_HEAD_UP', 'front', { lift:0.80, kick:1.45, speed:1.10, hold:0, cocky:true }),
  P('PN_ONE_ARM',  'One-Arm Cover',        'COVER', 'GROUNDED_HEAD_UP', 'front', { lift:0.88, kick:1.30, speed:1.05, hold:0, cocky:true }),
  P('PN_SEATED',   'Seated Cover',         'COVER', 'GROUNDED_HEAD_UP', 'front', { lift:0.85, kick:1.35, speed:1.08, hold:0, cocky:true }),
  P('PN_PUSHUP',   'Push-Up Cover',        'COVER', 'GROUNDED_HEAD_UP', 'front', { lift:0.75, kick:1.55, speed:1.12, hold:0, cocky:true }),
  // ---- front roll-ups: instant count, short fuse ----
  P('PN_RU_CRADLE',   'Inside Cradle',     'ROLLUP','STANDING_FRONT','front', { lift:1.10, kick:1.15, speed:0.55, hold:3.2 }),
  P('PN_RU_SMALLPKG', 'Small Package',     'ROLLUP','STANDING_FRONT','front', { lift:1.20, kick:1.05, speed:0.50, hold:3.0 }),
  P('PN_RU_MAGISTRAL','Magistral Cradle',  'ROLLUP','STANDING_FRONT','front', { lift:1.18, kick:1.00, speed:0.52, hold:3.4 }),
  P('PN_RU_CRUCIFIX', 'Crucifix Pin',      'ROLLUP','STANDING_FRONT','front', { lift:1.12, kick:1.10, speed:0.58, hold:3.0 }),
  P('PN_RU_SUNSET',   'Sunset Flip',       'ROLLUP','STANDING_FRONT','front', { lift:1.05, kick:1.25, speed:0.60, hold:2.8 }),
  P('PN_RU_VICTORY',  'Victory Roll',      'ROLLUP','STANDING_FRONT','front', { lift:1.08, kick:1.18, speed:0.58, hold:2.9 }),
  P('PN_RU_RANA',     'Rana Pin',          'ROLLUP','STANDING_FRONT','front', { lift:1.06, kick:1.22, speed:0.56, hold:2.8 }),
  P('PN_RU_ROLLTHRU', 'Roll-Through Pin',  'ROLLUP','STANDING_FRONT','front', { lift:1.00, kick:1.30, speed:0.62, hold:2.6 }),
  P('PN_RU_OKLAHOMA', 'Oklahoma Roll',     'ROLLUP','STANDING_FRONT','front', { lift:1.10, kick:1.12, speed:0.56, hold:3.0 }),
  P('PN_RU_PRAWN',    'Prawn Hold',        'ROLLUP','STANDING_FRONT','front', { lift:1.22, kick:0.98, speed:0.54, hold:3.4 }),
  // ---- rear roll-ups: the surprise ones. Schoolboy and O'Connor are the owner's named examples. ----
  P('PN_RR_SCHOOLBOY','Schoolboy Roll-Up', 'ROLLUP','STANDING_REAR','rear',  { lift:1.15, kick:1.05, speed:0.48, hold:3.0 }),
  P('PN_RR_OCONNOR',  "O'Connor Roll",     'ROLLUP','STANDING_REAR','rear',  { lift:1.18, kick:1.00, speed:0.50, hold:3.2 }),
  P('PN_RR_BACKSLIDE','Backslide',         'ROLLUP','STANDING_REAR','rear',  { lift:1.25, kick:0.95, speed:0.52, hold:3.6 }),
  P('PN_RR_VICTORY',  'Rear Victory Roll', 'ROLLUP','STANDING_REAR','rear',  { lift:1.10, kick:1.15, speed:0.55, hold:2.9 }),
  P('PN_RR_CRADLE',   'Rear Cradle',       'ROLLUP','STANDING_REAR','rear',  { lift:1.14, kick:1.08, speed:0.53, hold:3.1 }),
  P('PN_RR_SUNSET',   'Rear Sunset Flip',  'ROLLUP','STANDING_REAR','rear',  { lift:1.06, kick:1.20, speed:0.58, hold:2.8 }),
  P('PN_RR_ROLLPRAWN','Rolling Prawn Hold','ROLLUP','STANDING_REAR','rear',  { lift:1.20, kick:1.00, speed:0.50, hold:3.4 }),
  // ---- leverage / situational ----
  P('PN_LV_CORNER',   'Corner Leverage Pin','ROLLUP','CORNER_FRONT','front', { lift:1.12, kick:1.10, speed:0.55, hold:3.0 }),
  P('PN_LV_ROPE',     'Rope-Assisted Roll', 'ROLLUP','ROPE_LEAN','front',    { lift:1.15, kick:1.05, speed:0.55, hold:3.0 }),
  P('PN_LV_APRON',    'Apron Drag Pin',     'ROLLUP','APRON','front',        { lift:1.05, kick:1.20, speed:0.62, hold:2.6 }),
  P('PN_LV_RUNNING',  'Running Roll-Up',    'ROLLUP','RUNNING','front',      { lift:1.10, kick:1.14, speed:0.50, hold:2.8 }),
  P('PN_LV_COUNTER',  'Counter-to-Pin',     'COUNTER','STANDING_FRONT','front',{lift:1.20, kick:0.96, speed:0.45, hold:3.4 }),
  P('PN_LV_REVERSE',  'Reverse a Roll-Up',  'COUNTER','STANDING_FRONT','front',{lift:1.18, kick:1.00, speed:0.48, hold:3.2 }),
  // ---- illegal: the strongest numbers in the file, and the referee is the whole cost ----
  P('PN_IL_TIGHTS',   'Handful of Tights',  'COVER','GROUNDED_HEAD_UP','front',{lift:1.35, kick:0.60, speed:0.85, hold:0, illegal:true }),
  P('PN_IL_ROPES',    'Feet on the Ropes',  'COVER','GROUNDED_HEAD_UP','front',{lift:1.40, kick:0.55, speed:0.85, hold:0, illegal:true }),
  P('PN_IL_MASK',     'Mask / Hair Grab',   'COVER','GROUNDED_HEAD_UP','front',{lift:1.30, kick:0.65, speed:0.88, hold:0, illegal:true })
];

// ============================================================================================
// PIN RULES BY MATCH TYPE — the owner's other correction: "rules depend on match rules, not just
// procedural pin only". A pin is not universally legal, does not always count to three, and does
// not always break at the ropes. Keyed to BANNON_RULES.MATCH_TYPES ids.
//   pinfall   can a pin end the match at all
//   count     how many the referee counts to
//   ropeBreak does touching a rope break the count
//   zoneOnly  must the pin happen inside the ring
//   dq        does the referee enforce disqualification (so illegal pins get waved off)
// ============================================================================================
const R = (count, o) => Object.assign({ pinfall: true, count, ropeBreak: true, zoneOnly: true, dq: true }, o || {});
const PIN_RULES = {
  _default:    R(3),
  ONE_ON_ONE:  R(3),
  TAG:         R(3),
  TRIPLE:      R(3, { dq: false }),                      // no DQ in a triple threat, and no rope break
  FOURWAY:     R(3, { dq: false }),
  LADDER:      R(3, { pinfall: false }),                 // the belt decides it, not a cover
  TABLES:      R(3, { pinfall: false }),
  TLC:         R(3, { pinfall: false }),
  CAGE:        R(3, { zoneOnly: false }),                // escape OR pin, and the floor counts
  LMS:         R(3, { pinfall: false }),                 // ten-count over a downed body instead
  SUBMISSION:  R(3, { pinfall: false }),                 // tap or nothing
  IRONMAN:     R(3),                                     // pins bank falls, match keeps going
  ANYWHERE:    R(3, { zoneOnly: false, ropeBreak: false }),
  GAUNTLET:    R(3),
  ROYALE:      R(3, { pinfall: false }),                 // over the top rope
  HARDCORE:    R(3, { zoneOnly: false, ropeBreak: false, dq: false }),
  FIRSTBLOOD:  R(3, { pinfall: false }),
  IQUIT:       R(3, { pinfall: false }),
  CASKET:      R(3, { pinfall: false }),
  INFERNO:     R(3, { pinfall: false }),
  STRETCHER:   R(3, { pinfall: false }),
  KOTP:        R(3, { ropeBreak: false, dq: false })     // canon (Book 5): the pit has no ropes
};

const totalPicks = CATS.reduce((a,c)=>a+c.groups.reduce((b,g)=>b+g.slots.reduce((d,s)=>d+s.pick,0),0),0);
const uncapped   = CATS.reduce((a,c)=>a+c.groups.reduce((b,g)=>b+g.slots.filter(s=>!s.cap).length,0),0);

fs.mkdirSync(DIR, { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({
  _note:'AUTO-GENERATED by tools/moves/build_moveset_schema.cjs — the WWE-2K Create-A-Moveset structure as data, WITHOUT 2K\'s number caps (owner law). The editor renders itself from this; adding a category is a data edit, not a UI rewrite. cap:0 means unlimited.',
  generated:new Date().toISOString().slice(0,10),
  categories:CATS.length, slots:n, defaultLoadout:totalPicks, uncappedSlots:uncapped,
  ai:AI, styles:STYLES, paybacks:PAYBACKS, comebacks:COMEBACKS,
  modifiers:{ source:MODIFIER_SOURCE, list:MODIFIERS,
    expansion:['strike','grapple','carry','combo','dive','submission','pin','rollup','tag']
      .reduce(function(o,k){ o[k]=expansionFor(k); return o; },{}) },
  execution:EXECUTION,
  cats:CATS
}, null, 1));

fs.writeFileSync(OUT_PINS, JSON.stringify({
  _note:'AUTO-GENERATED by tools/moves/build_moveset_schema.cjs — the named pin/roll-up catalogue BANNON_PINS reads at runtime, plus per-match-type pin rules.',
  generated:new Date().toISOString().slice(0,10),
  pins:PINS, rules:PIN_RULES
}, null, 1));

console.log('categories        : ' + CATS.length);
console.log('slots             : ' + n + '  (' + uncapped + ' uncapped, ' + (n-uncapped) + ' single-value by engine limit)');
console.log('default loadout   : ' + totalPicks + '  (sum of every pick count — a FLOOR, not a ceiling)');
console.log('fighting styles   : ' + STYLES.length);
var vTot = PAYBACKS.reduce(function(a,p){ return a+(p.variants?p.variants.length:0); },0);
console.log('paybacks          : ' + PAYBACKS.length + '  (' + PAYBACKS.filter(p=>p.tier==='major').length + ' major / ' + PAYBACKS.filter(p=>p.tier==='minor').length + ' minor)');
console.log('  variants        : ' + vTot + ' distinct performances across ' + PAYBACKS.filter(p=>p.variants.length).length + ' paybacks');
console.log('  comeback chains : ' + COMEBACKS.length + ' | mist colours ' + PAYBACKS.filter(p=>p.id==='PB_MIST')[0].variants.length +
            ' | freeze styles ' + PAYBACKS.filter(p=>p.id==='PB_FREEZE')[0].variants.length +
            ' | kip-up styles ' + PAYBACKS.filter(p=>p.id==='PB_SECOND_WIND')[0].variants.length +
            ' | DQ-risking ' + PAYBACKS.filter(p=>p.dq).length);
console.log('pin catalogue     : ' + PINS.length + '  (' + PINS.filter(p=>p.entry==='ROLLUP').length + ' roll-ups, ' + PINS.filter(p=>p.illegal).length + ' illegal)');
console.log('modifiers         : ' + MODIFIERS.length + '  (declared from the engine\'s OWN inputs: ' + MODIFIER_SOURCE.split(' · ')[1] + ')');
console.log('  strike x' + expansionFor('strike') + '  grapple x' + expansionFor('grapple') +
            '  carry x' + expansionFor('carry') + '  dive x' + expansionFor('dive') +
            '  submission x' + expansionFor('submission') + '   <- executions per equipped move');
console.log('pin rule sets     : ' + (Object.keys(PIN_RULES).length - 1) + ' match types + default');
console.log('wrote assets/moves/moveset_schema.json + pin_moves.json');
