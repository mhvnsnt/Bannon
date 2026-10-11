#pragma once
// BANNON native striking — real physics strike resolution. Force comes from the striking limb's
// velocity (capped at MAX_BODY_VEL) times a base force; it drives the target joint's impact through
// the ragdoll (give + recover) and routes damage/poise to the WrestlerState (poise -> crumple).
#include "bannon_rig.h"

namespace bannon {

struct Strike {
    int   targetJoint;   // which of the 15 joints is hit
    float baseForce;     // move's inherent force
    float limbVelocity;  // striking limb speed (m/s)
};

// resolve a strike onto a defender's ragdoll. `dir` = world impact direction.
inline float resolveStrike(Ragdoll& defender, const Strike& s, const Vec3& dir) {
    float v = s.limbVelocity > MAX_BODY_VEL ? MAX_BODY_VEL : s.limbVelocity;  // native cap
    float rawForce = s.baseForce * v;
    Vec3 impulse = dir.normalized() * (rawForce * 0.02f);
    defender.applyHit(s.targetJoint, impulse, rawForce);   // impulse + poise/HP + limb-give
    return rawForce;
}

} // namespace bannon
