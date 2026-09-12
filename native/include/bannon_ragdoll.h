#pragma once
// BANNON native active ragdoll — PD (proportional-derivative) controllers drive each joint toward its
// animation target while physics impulses fight back on impact. This is the wrestler-feel core:
// upright/controlled when unopposed, gives on hits, recovers. Fixed-step Verlet (no variable-dt jitter).
#include "bannon_core.h"

namespace bannon {

struct RigidBody {
    Vec3 pos, prevPos, vel, force;
    float invMass = 1.0f;

    void integrate(float dt) {
        vel += force * (invMass * dt);
        vel = vel.clampedLength(MAX_BODY_VEL);   // native hard cap
        prevPos = pos;
        pos += vel * dt;
        force = Vec3();
    }
};

// PD controller: torque = kp*(targetRot error) - kd*angularVel. Here expressed on the joint's
// world position target so it plugs into a positional solver; swap for true torque under Jolt/PhysX.
struct PDJoint {
    RigidBody body;
    Vec3  target;        // animation-driven world target for this joint
    float kp = 900.0f;   // stiffness  (raise -> tracks animation harder / more "controlled")
    float kd = 60.0f;    // damping    (near-critical -> one give then settle, no bobble)
    float blend = 1.0f;  // 1 = fully motored to animation, 0 = fully limp (set low on the hit limb)

    void drive(float dt) {
        Vec3 err = target - body.pos;
        Vec3 pd  = err * (kp * blend) - body.vel * (kd * blend);
        body.force += pd;
        body.integrate(dt);
    }
};

// bone-length constraint (keeps limbs attached — the native version of the render clamp)
inline void constrainBone(RigidBody& a, RigidBody& b, float restLen, float stiff = 1.0f) {
    Vec3 d = b.pos - a.pos;
    float len = d.length();
    if (len < 1e-6f) return;
    float diff = (len - restLen) / len * stiff;
    float wa = a.invMass / (a.invMass + b.invMass);
    float wb = b.invMass / (a.invMass + b.invMass);
    a.pos += d * (diff * wa);
    b.pos -= d * (diff * wb);
}

} // namespace bannon
