#pragma once
// BANNON native solvers — a first batch of the "bricks 245–444" active-ragdoll directives ported into
// the real C++ core (not the src/engine speculative stubs). Each is a pure, testable function that
// builds on bannon_math / bannon_core / bannon_ragdoll. Brick numbers reference the owner's spec list.
#include "bannon_ragdoll.h"
#include "bannon_core.h"
#include <vector>

namespace bannon {

// ── Brick 247 — BLUNT FORCE KINETIC SHOCKWAVE PROPAGATION ─────────────────────────────────────────
// Bleed a strike's force down a bone chain (e.g. shoulder→elbow→wrist), attenuating per hop, and push
// each body along `dir`. Returns the force that reaches the chain's end (what the mat/next body feels).
inline float propagateShockwave(std::vector<RigidBody*>& chain, float impact, const Vec3& dir,
                                float attenPerHop = 0.55f) {
    float f = impact;
    Vec3 d = dir.normalized();
    for (RigidBody* b : chain) {
        b->force += d * (f * 0.02f);     // same impulse scale as resolveStrike
        f *= attenPerHop;                // energy dissipates down the chain
    }
    return f;
}

// ── Brick 246 / 321 — DYNAMIC SPINAL TORSION & TWISTING LIMITER ───────────────────────────────────
// Clamp a joint's target rotation to within `maxRad` of its rest — kills 360° spin/flip artifacts and
// enforces physiological range on multi-axis twisting grapples. (Quaternion "clamp toward rest".)
inline Quat clampJointRotation(const Quat& q, const Quat& rest, float maxRad) {
    // relative rotation rest^-1 * q
    Quat rel = rest.conjugate() * q;
    rel.normalize();
    float w = rel.w < -1.0f ? -1.0f : (rel.w > 1.0f ? 1.0f : rel.w);
    float ang = 2.0f * std::acos(w);
    if (ang <= maxRad || ang < 1e-6f) return q;
    float t = maxRad / ang;                 // scale the relative rotation down
    // slerp rest -> q by t  (nlerp is fine at these angles, then renormalize)
    Quat out(rest.x + (q.x - rest.x) * t, rest.y + (q.y - rest.y) * t,
             rest.z + (q.z - rest.z) * t, rest.w + (q.w - rest.w) * t);
    out.normalize();
    return out;
}

// ── Brick 298 — DYNAMIC IMPACT FORCE SCALING PER BODY ZONE ────────────────────────────────────────
// Route raw force through a per-zone multiplier: head is fragile, torso soaks, limbs middling.
inline float zoneImpactMultiplier(int joint) {
    switch (joint) {
        case J_HEAD:                       return 1.5f;   // head/neck — whiplash prone
        case J_CHEST: case J_PELVIS:       return 1.0f;   // core — reference
        case J_SHL: case J_SHR:
        case J_HIPL: case J_HIPR:          return 0.85f;  // proximal limb roots
        default:                           return 0.7f;   // distal limbs — least damage transfer
    }
}

// ── Brick 290 — DYNAMIC MASS RATIO THROW STABILIZER ───────────────────────────────────────────────
// A lifter's COM destabilizes when hoisting a heavier opponent unless momentum compensates.
// Returns a stability scalar in [0,1]; canLift() thresholds it. (Mirrors the web canLiftOpponent.)
inline float liftStability(float lifterMass, float targetMass, float momentum /*0..1*/) {
    if (targetMass < 1e-3f) return 1.0f;
    float ratio = lifterMass / targetMass;            // >1 = lifter heavier (easy)
    float s = ratio - 1.0f + momentum * 0.6f + 0.15f; // momentum + a small base allowance
    return s < 0.0f ? 0.0f : (s > 1.0f ? 1.0f : s);
}
inline bool canLift(float lifterMass, float targetMass, float momentum) {
    return liftStability(lifterMass, targetMass, momentum) > 0.05f;
}

// ── Brick 250 — ACTIVE RAGDOLL TENSION RECOVERY INTERPOLATOR ──────────────────────────────────────
// Blend a joint from limp (blend→0 after a hit) back to fully motored (1.0) — the "heap of canvas back
// to structural muscle tension" transition. Mutates and returns the new blend.
inline float recoverTension(float blend, float dt, float rate = 2.2f) {
    blend += (1.0f - blend) * (rate * dt);
    return blend > 1.0f ? 1.0f : blend;
}

// ── Brick 270 — DYNAMIC KNEE BUCKLING COLLAPSE ────────────────────────────────────────────────────
// Vertical load beyond the leg's remaining integrity triggers a buckle (knee flexes / fighter drops).
inline bool kneeBuckles(float verticalLoad, float legDamage01 /*0 fresh .. 1 destroyed*/) {
    float threshold = MAX_BODY_VEL * (1.0f - 0.6f * legDamage01);  // damaged legs give sooner
    return verticalLoad > threshold;
}

// ── Brick 425 / 430 — PROCEDURAL KICKOUT / PIN CONSTRAINT BREAKER ─────────────────────────────────
// Upward explosive impulse that dislodges a pinning attacker, driven by the pinned fighter's remaining
// health + stamina. Below a floor it fails (the pin holds → the count continues).
inline float kickoutImpulse(float hpFrac /*0..1*/, float stamFrac /*0..1*/) {
    float e = hpFrac * 0.5f + stamFrac * 0.5f;
    return e < 0.18f ? 0.0f : e * MAX_BODY_VEL;   // <0.18 combined reserve => no kickout
}

} // namespace bannon
