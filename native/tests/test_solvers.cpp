#include "bannon_solvers.h"
#include <cstdio>
#include <cmath>

using namespace bannon;

int main() {
    int fails = 0;
    auto check = [&](const char* name, bool ok, const char* detail) {
        printf("[%s] %s %s\n", ok ? "ok" : "FAIL", name, detail); if (!ok) fails++;
    };

    // Brick 247 — shockwave attenuates down the chain; far body gets less force than the struck one.
    RigidBody sh, el, wr; std::vector<RigidBody*> chain{ &sh, &el, &wr };
    float endF = propagateShockwave(chain, 100.0f, Vec3(-1, 0, 0), 0.55f);
    bool atten = endF < 100.0f && sh.force.length() > el.force.length() && el.force.length() > wr.force.length();
    char b[128]; snprintf(b, sizeof b, "endForce=%.1f  sh>el>wr forces (%.3f>%.3f>%.3f)", endF, sh.force.length(), el.force.length(), wr.force.length());
    check("shockwave-propagation(247)", atten, b);

    // Brick 246/321 — a 180° twist gets clamped to the physiological max (~80°).
    Quat rest;                                              // identity rest
    Quat huge = Quat::fromAxisAngle(Vec3(0,1,0), 3.14159f); // 180° twist
    float maxRad = 80.0f * 3.14159f / 180.0f;
    Quat clamped = clampJointRotation(huge, rest, maxRad);
    float cw = clamped.w < -1 ? -1 : (clamped.w > 1 ? 1 : clamped.w);
    float ang = 2.0f * std::acos(std::fabs(cw));
    snprintf(b, sizeof b, "clamped angle=%.1fdeg (cap 80)", ang * 180.0f / 3.14159f);
    check("spinal-torsion-limiter(246)", ang <= maxRad + 0.02f, b);

    // Brick 298 — head takes more than torso takes more than a distal limb.
    bool zone = zoneImpactMultiplier(J_HEAD) > zoneImpactMultiplier(J_CHEST) &&
                zoneImpactMultiplier(J_CHEST) > zoneImpactMultiplier(J_FTL);
    snprintf(b, sizeof b, "head=%.2f chest=%.2f foot=%.2f", zoneImpactMultiplier(J_HEAD), zoneImpactMultiplier(J_CHEST), zoneImpactMultiplier(J_FTL));
    check("zone-impact-scaling(298)", zone, b);

    // Brick 290 — light lifter can't hoist a much heavier foe without momentum; momentum rescues it.
    bool noLift = !canLift(0.9f, 1.8f, 0.0f);      // featherweight vs heavyweight, no run-up
    bool momLift = canLift(0.9f, 1.8f, 1.0f);      // same, full momentum surge
    snprintf(b, sizeof b, "stab(no-mom)=%.2f stab(full)=%.2f", liftStability(0.9f,1.8f,0.0f), liftStability(0.9f,1.8f,1.0f));
    check("mass-ratio-throw(290)", noLift && momLift, b);

    // Brick 250 — a limp joint (blend 0) recovers toward 1 over ~1s of fixed steps, monotonically.
    float blend = 0.0f; float prev = -1.0f; bool mono = true;
    for (int i = 0; i < 120; ++i) { blend = recoverTension(blend, FIXED_DT); if (blend < prev) mono = false; prev = blend; }
    snprintf(b, sizeof b, "blend after 1s=%.3f monotonic=%d", blend, mono);
    check("tension-recovery(250)", blend > 0.7f && blend <= 1.0f && mono, b);

    // Brick 270 — a fresh leg holds a moderate load; a wrecked leg buckles under the same load.
    bool freshHolds = !kneeBuckles(2.0f, 0.0f);
    bool wreckedBuckles = kneeBuckles(2.0f, 0.9f);
    snprintf(b, sizeof b, "freshHolds=%d wreckedBuckles=%d", freshHolds, wreckedBuckles);
    check("knee-buckling(270)", freshHolds && wreckedBuckles, b);

    // Brick 425/430 — healthy+fresh kicks out; spent+hurt cannot.
    bool kicks = kickoutImpulse(0.8f, 0.7f) > 0.0f;
    bool cantKick = kickoutImpulse(0.1f, 0.1f) == 0.0f;
    snprintf(b, sizeof b, "strongKick=%.2f weakKick=%.2f", kickoutImpulse(0.8f,0.7f), kickoutImpulse(0.1f,0.1f));
    check("kickout-breaker(425)", kicks && cantKick, b);

    printf(fails ? "\n%d FAIL\n" : "\nALL PASS\n", fails);
    return fails ? 1 : 0;
}
