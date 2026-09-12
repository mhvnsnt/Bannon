#!/usr/bin/env bash
# Generate the ring-transition captures BANNON_ZONEMOVE has phases for but no animation data.
#
#   bash tools/mocap/gen_zone_transitions.sh
#
# WHY: BANNON_ZONEMOVE gives every route real sub-phases (duck / through / drop / land / slide /
# pull-up) and drives each one's height curve and body lean. What it does NOT have is a capture per
# phase -- `clipFramesUsed` measured 0, because the phase->clip map only plays something already
# resident and nothing matching existed. There is no mocap library of "wrestler ducks through the
# middle rope"; this is exactly the gap MoMask was installed for.
#
# EACH PHASE GETS SEVERAL DISTINCT PROMPTS, not one. WWE-style variety comes from a wrestler not
# entering the ring the same way twice, so the pool per phase is what matters, and BANNON_ZONEMOVE
# already picks a VAULT / STEP / NORMAL variant per fighter from their style bias.
#
# The prompts describe HUMAN MOVEMENT, never wrestling jargon. MoMask is trained on HumanML3D, which
# has never seen a turnbuckle -- "slides under the bottom rope" generates nothing useful, while
# "crouches low and slides forward along the ground" generates exactly the motion we need. That
# lesson is already written down for the brainbuster work; it applies double here.
set -u
cd /home/user/Bannon

gen(){  # gen KEY FRAMES "prompt"
  local key="$1" frames="$2" prompt="$3"
  if [ -f "assets/moves/clips/${key}.json" ]; then echo "  skip ${key} (exists)"; return; fi
  timeout 900 python3 tools/mocap/text_to_clip.py "$prompt" --name "$key" --frames "$frames" 2>&1 \
    | grep -E "^  ${key}|KB written|ERROR|Traceback" | head -3
}

echo "== FLOOR -> RING : slide under the bottom rope =="
gen ZONE_SLIDE_IN_A 70 "a person crouches low and slides forward along the ground then stands up"
gen ZONE_SLIDE_IN_B 70 "a person dives forward onto their stomach, slides, and pushes up to their feet"
gen ZONE_SLIDE_IN_C 80 "a person drops to their knees, scrambles forward on all fours and rises"

echo "== RING <-> APRON : duck through a gap =="
gen ZONE_DUCK_A 60 "a person bends forward at the waist and steps through a narrow opening"
gen ZONE_DUCK_B 60 "a person crouches and ducks their head under a low bar, stepping through"
gen ZONE_DUCK_C 65 "a person lifts one leg high over a low barrier and steps across"

echo "== APRON -> FLOOR : drop down and absorb =="
gen ZONE_DROP_A 55 "a person steps off a low ledge, drops down and lands in a crouch"
gen ZONE_DROP_B 55 "a person hops down from a platform and absorbs the landing with bent knees"
gen ZONE_DROP_C 60 "a person jumps down backwards from a ledge and steadies themselves"

echo "== FLOOR -> APRON : haul yourself up =="
gen ZONE_PULLUP_A 75 "a person reaches up, grabs a ledge and pulls themselves up onto it"
gen ZONE_PULLUP_B 75 "a person climbs up onto a waist-high platform and stands"
gen ZONE_PULLUP_C 80 "a person steps up onto a raised edge and straightens up"

echo "== EXTRAS the routes can draw on =="
gen ZONE_ROLL_OUT_A 60 "a person rolls sideways along the ground and comes up onto their feet"
gen ZONE_VAULT_A 55 "a person vaults over a waist-high obstacle with one hand on top"
gen ZONE_CLIMB_A 90 "a person climbs up a tall structure hand over hand and stands at the top"

echo
echo "generated into assets/moves/clips/. Multiply any of them:"
echo "  python3 tools/mocap/harvest.py --variants ZONE_SLIDE_IN_A"
echo "Then wire the keys into BANNON_ZONEMOVE's PHASE_CLIP map."
