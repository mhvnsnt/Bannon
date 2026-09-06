#pragma once
// BANNON native — 4-QUADRANT RELEASE MATRIX + WEAPON PHYSICS (from the owner's design transcripts,
// validated + implemented for real; the transcripts' "compiled" claims never landed anywhere).
//
// Release matrix, OWNER'S CANONICAL MAPPING:
//   A = SLAM  — driven downward force (not gravity: applied −Y velocity, max poise shock)
//   B = LAZY DROP — zero-velocity release; sever constraints, gravity does 100% of the work
//   X = THROW — directional linear momentum along the stick (X/Z), shallow arc, distance-focused
//   Y = TOSS  — heavy angular torque + steep parabola; costs the most stamina, botch-prone when gassed
//
// Weapons are PHYSICAL OBJECTS, not props: mass taxes stamina on every swing, whiffs cost 2.5×
// (momentum over-extension), reversals add a flat shock, and damaged arms cap swing velocity and
// inflate the tax — swinging a chair with a wrecked arm will gas you out.
#include "bannon_core.h"
#include "bannon_math.h"

namespace bannon {

// ── 4-QUADRANT RELEASE MATRIX ────────────────────────────────────────────────────────────────────
enum ReleaseKind { R_SLAM = 0 /*A*/, R_DROP /*B*/, R_THROW /*X*/, R_TOSS /*Y*/ };

struct ReleaseResult {
    Vec3  velocity;      // impulse applied to the victim's root at release
    float angular;       // rotational torque magnitude (pitch/roll spin)
    float staminaCost;   // attacker stamina spent executing the release
    bool  botchRisk;     // true when the executor is too gassed for the move's demand
};

// dir = attacker's aim (stick direction, normalized on X/Z); stam01 = attacker stamina fraction;
// massDelta = victimMass/attackerMass (heavier victims damp velocities and raise costs).
inline ReleaseResult releaseImpulse(ReleaseKind k, const Vec3& dir, float stam01, float massDelta) {
    ReleaseResult r{};
    float md = massDelta <= 0.f ? 1.f : massDelta;
    float power = (0.55f + 0.45f * stam01) / md;              // gassed or outweighed = weaker release
    Vec3 flat = Vec3(dir.x, 0, dir.z).normalized();
    switch (k) {
        case R_SLAM:   // driven INTO the mat — beyond free-fall
            r.velocity = Vec3(flat.x * 0.6f, -MAX_BODY_VEL, flat.z * 0.6f) * power;
            r.angular = 0.2f; r.staminaCost = 26.f * md; break;
        case R_DROP:   // just let go — zero added velocity, gravity owns it
            r.velocity = Vec3(); r.angular = 0.f; r.staminaCost = 6.f; break;
        case R_THROW:  // linear projectile along the stick, shallow arc
            r.velocity = Vec3(flat.x * MAX_BODY_VEL, MAX_BODY_VEL * 0.25f, flat.z * MAX_BODY_VEL) * power;
            r.angular = 0.35f; r.staminaCost = 20.f * md; break;
        case R_TOSS:   // heavy angular arc — the big rotation, the big cost
            r.velocity = Vec3(flat.x * MAX_BODY_VEL * 0.75f, MAX_BODY_VEL * 0.85f, flat.z * MAX_BODY_VEL * 0.75f) * power;
            r.angular = 1.6f * power; r.staminaCost = 34.f * md; break;
    }
    r.velocity = r.velocity.clampedLength(MAX_BODY_VEL);      // immutable cap holds even here
    r.botchRisk = (k == R_TOSS && stam01 < 0.25f) || (stam01 < 0.12f && k != R_DROP);
    return r;
}

// ── WEAPON PHYSICS ───────────────────────────────────────────────────────────────────────────────
struct Weapon {
    float mass;          // kg — chair ~3.5, kendo ~1.2, steps ~18, ladder ~12
    float reach;         // m
    float integrity;     // structural HP; hard hits deform/bend, 0 = broken
};

// Extended-limb load: how much a held weapon shifts the carrier (stance lean + COM shift).
inline float weaponLeanBack(const Weapon& w, float bodyMass) {
    float f = w.mass / (bodyMass <= 0.f ? 80.f : bodyMass);
    return f > 0.25f ? 0.25f : f;                             // capped torso lean-back fraction
}

// Universal stamina tax: cost = mass × swing speed, whiffs 2.5×, reversals add a flat shock,
// injured arms (armHp01 < 0.5) inflate cost exponentially. Returns stamina to subtract.
inline float swingStaminaCost(const Weapon& w, float swingVel, bool whiffed, bool reversed, float armHp01) {
    float base = w.mass * (swingVel > MAX_BODY_VEL ? MAX_BODY_VEL : swingVel) * 1.15f;
    if (whiffed)  base *= 2.5f;                               // momentum over-extension
    if (reversed) base += MAX_STAMINA * 0.08f;                // kinetic shock: flat drain
    if (armHp01 < 0.5f) {
        float dmg = (0.5f - armHp01) * 2.f;                   // 0..1 as arm goes 50% -> 0%
        base *= (1.f + dmg * dmg * 3.f);                      // exponential injury drag
    }
    return base;
}

// Injury drag also caps how fast a wrecked arm can even swing (40% cap at zero arm HP).
inline float swingVelocityCap(float armHp01) {
    return armHp01 >= 0.5f ? MAX_BODY_VEL : MAX_BODY_VEL * (0.6f + 0.8f * armHp01);
}

// Impact: damage scales on weapon velocity × mass through DMG_SCALE; hard hits cost integrity;
// returns damage dealt. Drops the weapon (returns true via dropped) when shock beats grip.
inline float weaponImpact(Weapon& w, float impactVel, float gripStrength01, bool& dropped) {
    float v = impactVel > MAX_BODY_VEL ? MAX_BODY_VEL : impactVel;
    float dmg = w.mass * v * DMG_SCALE;
    w.integrity -= v * w.mass * 0.4f;                         // procedural dent/bend budget
    if (w.integrity < 0.f) w.integrity = 0.f;
    dropped = (v * w.mass) > (gripStrength01 * MAX_BODY_VEL * 6.f);
    return dmg;
}

// ── UNIVERSAL MOVE STAMINA (all moves, not just weapons — owner: "kind of obvious") ─────────────
inline float moveStaminaCost(float basePower, bool missed, bool reversed, float bodyHp01) {
    float c = basePower * 0.18f;
    if (missed)   c *= 2.0f;
    if (reversed) c *= 1.6f;
    if (bodyHp01 < 0.35f) c *= 1.5f;                          // hurt fighters gas faster
    return c;
}

} // namespace bannon
