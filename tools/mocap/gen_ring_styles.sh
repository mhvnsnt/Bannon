#!/usr/bin/env bash
# Ring-entry / ring-exit STYLES, plus locomotion, stances, guards and taunts.
#
#   bash tools/mocap/gen_ring_styles.sh
#
# Owner: "we need more ring in, apron to ring, ring to apron, floor to ring, running into ring,
# climbing turnbuckle animation and all in between phases... like how WWE history of games has the
# woman's ring in, the kane ring out, the brick Lesnar to apron and brick Lesnar ring in, etc...
# as well as locomotion, guards, stances, and taunts".
#
# NAMED BY THE MOTION, NEVER BY THE WRESTLER (owner LAW: proprietary names only, no real-wrestler
# names in the repo). The styles he described are all here -- the over-the-top exit, the hop up onto
# the apron and in, the through-the-ropes-and-pose -- under names that describe what the BODY does.
# A file called KANE_RING_OUT is a trademark sitting in the asset tree; OVER_THE_TOP_OUT is the same
# animation and ships.
#
# I SEARCHED FOR A CANONICAL LIST OF WWE RING-ENTRY ANIMATIONS AND DID NOT FIND ONE. Rather than
# invent a roster of "official" names I do not have, this set is built from the MOTION ARCHETYPES
# that actually differ from each other -- under the bottom rope, through the middle, over the top,
# up onto the apron first, vaulting, rolling, running. That is what the variety is made of.
#
# Prompts describe HUMAN MOVEMENT, not wrestling jargon: MoMask is HumanML3D-trained and has never
# seen a turnbuckle. This is the same lesson as gen_zone_transitions.sh.
set -u
cd /home/user/Bannon

gen(){  # gen KEY FRAMES "prompt"
  local key="$1" frames="$2" prompt="$3"
  if [ -f "assets/moves/clips/${key}.json" ]; then echo "  skip ${key}"; return; fi
  timeout 900 python3 tools/mocap/text_to_clip.py "$prompt" --name "$key" --frames "$frames" 2>&1 \
    | grep -E "^  ${key}|ERROR|Traceback" | head -2
}

echo "== RING ENTRY styles =="
gen ZONE_MIDROPE_STEP   65 "a person pushes two horizontal bars apart and steps between them"
gen ZONE_MIDROPE_POSE   85 "a person steps through a gap, turns and raises both arms above their head"
gen ZONE_OVER_TOP_IN    75 "a person lifts one leg high over a chest-high barrier and climbs across"
gen ZONE_APRON_HOP      70 "a person hops up onto a low platform and stands facing forward"
gen ZONE_VAULT_IN       60 "a person places both hands on a barrier and vaults over it feet first"
gen ZONE_ROLL_IN        60 "a person dives forward into a shoulder roll and comes up kneeling"
gen ZONE_RUN_SLIDE_IN   75 "a person runs forward then drops and slides along the ground"

echo "== RING EXIT styles =="
gen ZONE_OVER_TOP_OUT   75 "a person swings one leg over a chest-high barrier and drops to the ground"
gen ZONE_ROLL_OUT_B     60 "a person rolls forward off a low edge and lands on their feet"
gen ZONE_SLIDE_OUT      60 "a person lies down and slides backwards off a low platform"

echo "== TURNBUCKLE =="
gen ZONE_CLIMB_B        95 "a person climbs up three steps of a ladder and balances at the top"
gen ZONE_PERCH_POSE     70 "a person stands on a high narrow platform and raises both fists"

echo "== LOCOMOTION =="
gen LOCO_STALK          80 "a person walks forward slowly and heavily with shoulders hunched"
gen LOCO_STRUT          80 "a person walks forward with an arrogant swagger, chest out"
gen LOCO_PROWL          80 "a person paces forward in a low crouch like a hunting animal"
gen LOCO_LIGHT          70 "a person bounces forward on the balls of their feet"
gen LOCO_LUMBER         85 "a very heavy person walks forward with slow ponderous steps"

echo "== STANCES / GUARDS =="
gen STANCE_WIDE         55 "a person stands with feet wide apart and arms held out from the body"
gen STANCE_CROUCH       55 "a person crouches low with knees bent and hands forward ready to grapple"
gen STANCE_BLADED       55 "a person stands side on with one shoulder forward and fists raised"
gen GUARD_HIGH          55 "a person raises both fists beside their head and tucks their chin"
gen GUARD_LOW           55 "a person holds both hands low in front of their waist, knees bent"

echo "== TAUNTS =="
gen TAUNT_CALLOUT       70 "a person beckons someone forward with both hands, shouting"
gen TAUNT_ARMS_WIDE     70 "a person spreads both arms wide and tilts their head back"
gen TAUNT_POINT         65 "a person points forward aggressively with one arm extended"
gen TAUNT_FLEX          70 "a person flexes both arms in a bodybuilder pose"

echo
echo "done. Multiply any of them: python3 tools/mocap/harvest.py --variants <KEY>"
