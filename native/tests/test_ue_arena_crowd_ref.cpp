// Verifies the native laws that ABannonArena, UBannonCrowd and ABannonReferee now drive, and the
// unit conversions on the UE seam. These are the halves of those UE classes that CAN be compiled
// and checked outside Unreal — which is the whole point of keeping the laws engine-agnostic.
//
// Three of these assertions exist because of real bugs found while wiring them:
//   * refBump was called through a function-local `static bannon::RefState`, so one pool was shared
//     by every referee in the process and never reset between matches. The pool DRAINS, which is
//     correct per-match behaviour and catastrophic as a global — asserted below.
//   * bannon::Arena was never called from Unreal at all, so UE bodies had no ring boundary.
//   * the arena law is metres; the UE actor stores centimetres. Feeding 350 straight in would build
//     a 350-metre ring.
#include "bannon_core.h"
#include "bannon_arena.h"
#include "bannon_referee.h"
#include "bannon_universe.h"
#include <cstdio>
#include <cmath>

static int fails = 0;
static void chk(bool ok, const char* what) {
    printf("  %s %s\n", ok ? "PASS" : "FAIL", what);
    if (!ok) ++fails;
}

int main() {
    constexpr float M_TO_CM = 100.0f;

    // ── ARENA ────────────────────────────────────────────────────────────────────────────────
    printf("arena containment (ABannonArena::Contain):\n");
    {
        bannon::Arena A;                      // RING_4 defaults
        A.halfSize = 350.0f / M_TO_CM;        // the UE actor's RingHalfExtent, converted
        A.ropeY    = 120.0f / M_TO_CM;
        chk(std::fabs(A.halfSize - 3.5f) < 1e-5f, "350 cm RingHalfExtent -> 3.5 m halfSize");
        chk(std::fabs(A.ropeY - 1.2f) < 1e-5f,    "120 cm RopeHeight -> 1.2 m ropeY");

        // a body running out through the ropes below rope height is pushed back and REVERSED —
        // this is what makes a rope-run rebound exist.
        bannon::Vec3 p(5.0f, 0.5f, 0.0f), v(3.0f, 0.0f, 0.0f);
        const bool hit = A.contain(p, v);
        chk(hit, "body past the ropes reports a boundary hit");
        chk(std::fabs(p.x - 3.5f) < 1e-4f, "body clamped back to the rope line");
        chk(v.x < 0.0f, "velocity REVERSED (the rebound), not zeroed");

        // above the top rope you can go over — that is how a body gets to the apron and the floor
        bannon::Vec3 p2(5.0f, 2.0f, 0.0f), v2(3.0f, 0.0f, 0.0f);
        const bool hit2 = A.contain(p2, v2);
        chk(!hit2 && p2.x > 3.5f, "above ropeY a body clears the ropes instead of bouncing");

        // the floor always catches
        bannon::Vec3 p3(0.0f, -1.0f, 0.0f), v3(0.0f, -2.0f, 0.0f);
        A.contain(p3, v3);
        chk(std::fabs(p3.y - A.floorY) < 1e-5f && v3.y > 0.0f, "floor clamps and bounces upward");

        // OPEN = God Within: no ropes, only a far soft wall
        bannon::Arena O; O.mode = bannon::OPEN; O.openHalf = 3000.0f / M_TO_CM;
        bannon::Vec3 p4(10.0f, 0.5f, 0.0f), v4(3.0f, 0.0f, 0.0f);
        chk(!O.contain(p4, v4) && std::fabs(p4.x - 10.0f) < 1e-5f,
            "OPEN stage lets a body travel 10 m untouched (no ring boundary)");
        bannon::Vec3 p5(40.0f, 0.5f, 0.0f), v5(3.0f, 0.0f, 0.0f);
        chk(O.contain(p5, v5) && std::fabs(p5.x - 30.0f) < 1e-4f, "OPEN stage still walls at openHalf");
    }

    // ── REFEREE ──────────────────────────────────────────────────────────────────────────────
    printf("referee line of sight (ABannonReferee::HasLineOfSight):\n");
    {
        const bannon::Vec3 eye(0.0f, 1.55f, 0.0f);
        const bannon::Vec3 facing(1.0f, 0.0f, 0.0f);
        const bannon::Vec3 shoulders(2.0f, 0.3f, 0.0f);
        chk(bannon::refHasLineOfSight(eye, facing, shoulders, nullptr, 0),
            "clear sightline to the shoulders counts");

        // A STANDING body in the way. Its centre is at torso height (~0.93 m), which is where the
        // sight line from a 1.55 m eye down to 0.3 m shoulders actually passes at the halfway point —
        // put the occluder at the shoulders' height instead and it sits well below the line and
        // correctly does NOT block, which is the law behaving, not failing.
        const bannon::Vec3 blocker(1.0f, 0.93f, 0.0f);
        chk(!bannon::refHasLineOfSight(eye, facing, shoulders, &blocker, 1),
            "a body between ref and shoulders BLOCKS the count");

        const bannon::Vec3 behind(-2.0f, 0.3f, 0.0f);        // pin behind him
        chk(!bannon::refHasLineOfSight(eye, facing, behind, nullptr, 0),
            "a pin outside the view cone does not count");
    }

    printf("referee bump pool is PER REFEREE and drains (the static-state bug):\n");
    {
        bannon::RefState a, b;
        chk(std::fabs(a.poise - 40.0f) < 1e-5f, "fresh referee starts at 40 poise");

        const float first = bannon::refBump(a, 1.0f);
        chk(first == 0.0f && a.poise < 40.0f, "a light bump does not floor him but DOES cost poise");

        chk(std::fabs(b.poise - 40.0f) < 1e-5f,
            "a second referee is untouched by the first (would fail with shared static state)");

        const float hard = bannon::refBump(b, bannon::MAX_BODY_VEL);
        chk(hard > 0.0f && b.down, "a full-speed body floors a fresh referee");
        chk(hard > 2.5f && hard < 10.0f, "down time lands in the 2.5..~9 s window the law specifies");

        // draining is correct per match, which is exactly why it must reset between matches
        bannon::RefState c;
        bannon::refBump(c, 1.0f); bannon::refBump(c, 1.0f); bannon::refBump(c, 1.0f);
        const bool floored = bannon::refBump(c, 1.5f) > 0.0f;
        chk(floored, "repeated bumps floor him — a pool that never resets would start match 2 here");
        c = bannon::RefState();
        chk(std::fabs(c.poise - 40.0f) < 1e-5f, "ResetForMatch() restores a full pool");
    }

    printf("referee avoidance (ABannonReferee::AvoidanceVelocity):\n");
    {
        const bannon::Vec3 refPos(2.0f, 0.0f, 0.0f);
        // a body travelling +X straight at him
        const bannon::Vec3 esc = bannon::refAvoidanceVelocity(refPos, bannon::Vec3(0,0,0), bannon::Vec3(3.0f,0,0));
        chk(esc.length() > 0.0f, "an incoming body produces an escape velocity");
        chk(std::fabs(esc.x) < std::fabs(esc.z) + 1e-4f,
            "escape is PERPENDICULAR to travel (step off the line, not backpedal down it)");
        chk(esc.length() <= bannon::MAX_BODY_VEL * 0.7f + 1e-4f, "refs jog: capped at 0.7 * MAX_BODY_VEL");

        const bannon::Vec3 safe = bannon::refAvoidanceVelocity(refPos, bannon::Vec3(0,0,5.0f), bannon::Vec3(0,0,-0.2f));
        chk(safe.length() == 0.0f, "a slow, non-threatening body produces no escape");
    }

    // ── CROWD ────────────────────────────────────────────────────────────────────────────────
    printf("crowd reaction (UBannonCrowd::React / ReactAt):\n");
    {
        chk(bannon::crowdReaction(bannon::CE_HIGH_ARC_THROW, 3.8f) == 10, "a full-speed high arc is a 10");
        chk(bannon::crowdReaction(bannon::CE_HIGH_ARC_THROW, 1.0f) == 2,  "the same move done softly is a 2");
        chk(bannon::crowdReaction(bannon::CE_BOTCH_OR_STALL, 3.8f) < 0,   "a botch draws heat, not a pop");
        chk(bannon::crowdReaction(bannon::CE_WEAPON_IMPACT, 3.3f) == 9,   "a hard weapon shot is a 9");
        chk(bannon::crowdReaction(bannon::CE_NONE, 3.8f) == 0,            "no event, no reaction");
        // the velocity cap means nothing can pop past the law's ceiling
        chk(bannon::crowdReaction(bannon::CE_HIGH_ARC_THROW, 99.0f) ==
            bannon::crowdReaction(bannon::CE_HIGH_ARC_THROW, bannon::MAX_BODY_VEL),
            "impact velocity is clamped to MAX_BODY_VEL before it reaches the crowd");
    }

    printf("\n%s — %d failure(s)\n", fails ? "FAILED" : "ALL ARENA/CROWD/REFEREE LAWS VERIFIED", fails);
    return fails ? 1 : 0;
}
