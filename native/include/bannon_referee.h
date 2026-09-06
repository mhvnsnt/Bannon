#pragma once
// BANNON native — REFEREE AI + PIN + SUBMISSION physics (real implementations of the design specs
// in the AI-Studio "bannonengine_2" drop, whose C++ was cout-narrative stubs — see
// docs/bannonengine2_integration.md for the validation verdict).
//
// The referee is a PHYSICAL entity: 1.85 m mesh on the same rig, vulnerable to ragdoll collisions
// (ref bumps are physics events, not cutscenes). Pin counting is gated on genuine line-of-sight to
// the pinned wrestler's shoulders; kickouts are kinetic bursts scaled by reserve and count-tier;
// submissions drain LOCAL limb HP through joint torque past the rotation limit — the tap-out is
// organic (constraint failure), never a timing minigame (owner veto).
#include "bannon_core.h"
#include "bannon_math.h"

namespace bannon {

// ── LINE OF SIGHT ────────────────────────────────────────────────────────────────────────────────
// LoS cone from the ref's head to the pinned wrestler's shoulder midpoint. Occluders are the other
// bodies in the ring (multi-man): a pin count only advances when the shoulder line is inside the
// view cone AND no occluder capsule crosses the sight segment.
inline bool refHasLineOfSight(const Vec3& refEye, const Vec3& refFacing,
                              const Vec3& shoulderMid,
                              const Vec3* occluders, int occluderCount,
                              float occluderRadius = 0.30f,
                              float coneCosHalfAngle = 0.34f /* ~70° half-angle */) {
    Vec3 toPin = shoulderMid - refEye;
    float dist = toPin.length();
    if (dist < 1e-4f) return true;
    Vec3 dir = toPin * (1.0f / dist);
    if (refFacing.normalized().dot(dir) < coneCosHalfAngle) return false;   // outside view cone
    for (int i = 0; i < occluderCount; ++i) {
        // closest point on the sight segment to the occluder center
        Vec3 rel = occluders[i] - refEye;
        float t = rel.dot(dir);
        if (t <= 0.f || t >= dist) continue;                                // behind ref / past pin
        Vec3 closest = refEye + dir * t;
        if ((occluders[i] - closest).length() < occluderRadius) return false; // blocked
    }
    return true;
}

// ── PREDICTIVE SPATIAL AVOIDANCE ─────────────────────────────────────────────────────────────────
// The ref backpedals out of an incoming trajectory (Irish whip, Apex Forklift carry). Given the
// mover's position+velocity, returns the avoidance velocity for the ref (zero when safe).
// Perpendicular escape beats backpedal: step off the line of travel, not away from the mover.
inline Vec3 refAvoidanceVelocity(const Vec3& refPos, const Vec3& moverPos, const Vec3& moverVel,
                                 float dangerRadius = 1.1f, float lookahead = 0.6f /*s*/) {
    Vec3 v = moverVel; v.y = 0;                       // ring-plane threat only
    float speed = v.length();
    if (speed < 0.5f) return Vec3();                  // slow mover = no threat
    Vec3 dir = v * (1.0f / speed);
    Vec3 rel = refPos - moverPos; rel.y = 0;
    float along = rel.dot(dir);
    if (along < 0.f || along > speed * lookahead + dangerRadius) return Vec3(); // not in the path
    Vec3 lateral = rel - dir * along;                 // ref's offset from the travel line
    float latDist = lateral.length();
    if (latDist > dangerRadius) return Vec3();        // already clear
    // escape perpendicular to travel, away from the line; deterministic side if dead-center
    Vec3 escape = latDist > 1e-4f ? lateral * (1.0f / latDist) : Vec3(-dir.z, 0, dir.x);
    float urgency = 1.0f - (latDist / dangerRadius);  // 0 edge .. 1 dead-center
    return (escape * (0.6f + 1.4f * urgency)).clampedLength(MAX_BODY_VEL * 0.7f); // refs jog, not sprint
}

// ── REF BUMP ─────────────────────────────────────────────────────────────────────────────────────
// A wrestler colliding with the ref is a real impact through DMG_SCALE. The ref has his own small
// HP/poise pool; a bump past his poise floors him (active ragdoll) and suspends counts until he
// recovers. Returns seconds the ref is down (0 = stayed up).
struct RefState {
    float hp    = 1000.0f;   // refs are civilians: 1/10 wrestler pool
    float poise = 40.0f;
    bool  down  = false;
};
inline float refBump(RefState& ref, float impactVel) {
    float v = impactVel > MAX_BODY_VEL ? MAX_BODY_VEL : impactVel;
    float impact = v * DMG_SCALE;
    ref.hp    -= impact * 1.5f;
    ref.poise -= impact * 2.0f;
    if (ref.hp < 0.f) ref.hp = 0.f;
    if (ref.poise <= 0.f) {
        ref.down = true;
        ref.poise = 0.f;
        return 2.5f + v * 1.8f;                       // harder bump = longer nap, up to ~9 s
    }
    return 0.f;
}

// ── PIN KICKOUT (count-tier kinetic burst) ───────────────────────────────────────────────────────
// Extends bannon_solvers.h kickoutImpulse with the count-tier flavor: early kickouts are explosive
// (full reserve into one chest burst), 2.9s escapes are slow heavy struggles (most of the energy
// spent fighting the attacker's dead weight — small residual burst + long struggle time).
struct KickoutResult {
    float burstVel;      // upward kinetic burst injected into the defender's chest (m/s)
    float struggleTime;  // seconds of procedural struggle sine fed to the mesh before the break
    bool  escaped;
};
inline KickoutResult pinKickout(float hpFrac, float stamFrac, float kickTime /*s into count*/,
                                float massDelta /* attackerMass/defenderMass */) {
    KickoutResult r{};
    float reserve = hpFrac * 0.5f + stamFrac * 0.5f;
    float md = massDelta <= 0.f ? 1.f : massDelta;
    float need = 0.18f * md;                          // heavier attacker = higher escape threshold
    if (reserve < need) { r.escaped = false; r.burstVel = 0.f; r.struggleTime = 3.0f - kickTime; return r; }
    r.escaped = true;
    if (kickTime <= 1.0f) {          // 1-count: instant shatter, max burst
        r.burstVel = reserve * MAX_BODY_VEL;
        r.struggleTime = 0.1f;
    } else if (kickTime < 2.9f) {    // 2-count: medium struggle
        r.burstVel = reserve * MAX_BODY_VEL * 0.7f / md;
        r.struggleTime = 0.45f;
    } else {                         // 2.9: epic — energy eaten by the dead weight
        r.burstVel = reserve * MAX_BODY_VEL * 0.45f / md;
        r.struggleTime = 1.1f;
    }
    if (r.burstVel > MAX_BODY_VEL) r.burstVel = MAX_BODY_VEL;   // immutable cap
    return r;
}

// ── SUBMISSION TORQUE → LOCAL LIMB HP → ORGANIC TAP-OUT ──────────────────────────────────────────
// A hold cranks a joint toward its rotation limit; past the limit, torque drains LOCAL limb HP.
// The tap-out threshold is constraint failure (limb HP + pain vs remaining stamina), not a timer.
struct SubJoint {
    float rotation;        // current cranked rotation (rad past neutral)
    float rotationLimit;   // anatomical limit (rad)
    float limbHp;          // local limb HP (0..1000 scale like localized damage elsewhere)
};
// dt-step of a hold: attackerCrank (0..1 analog) vs defenderResist (0..1, stamina-weighted).
// Returns true when the defender taps (organic threshold).
inline bool submissionStep(SubJoint& j, float attackerCrank, float defenderResist,
                           float& defenderStamina, float dt) {
    float net = attackerCrank - defenderResist * 0.8f;          // resisting is slightly cheaper
    j.rotation += net * 1.5f * dt;                              // torque = crank × 1.5 (spec value)
    if (j.rotation < 0.f) j.rotation = 0.f;
    defenderStamina -= (defenderResist * 22.f + attackerCrank * 6.f) * dt; // fighting the hold gasses
    if (defenderStamina < 0.f) defenderStamina = 0.f;
    if (j.rotation > j.rotationLimit) {
        float over = j.rotation - j.rotationLimit;
        j.limbHp -= over * 2.0f * 60.f * dt;                    // past the limit: local HP drains fast
        if (j.limbHp < 0.f) j.limbHp = 0.f;
    }
    // organic tap-out: limb wrecked, or deep strain with no stamina left to fight it
    float strain = j.rotationLimit > 1e-4f ? j.rotation / j.rotationLimit : 1.f;
    return (j.limbHp <= 0.f) || (strain > 0.92f && defenderStamina < MAX_STAMINA * 0.06f);
}

} // namespace bannon
