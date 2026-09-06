#pragma once
// BANNON Jolt backend — real rigid-body active ragdoll. Maps the 15 joints to Jolt bodies connected
// by the bone hierarchy, driven by PD motors toward animation targets, impulses on impact. Same rig
// (bannon_rig.h) and same arena (bannon_arena.h) as the positional path; this swaps the solver.
//
// Enable: add Jolt as a submodule + build with -DBANNON_USE_JOLT=ON.
//   git submodule add https://github.com/jrouwe/JoltPhysics native/third_party/JoltPhysics
// API targets Jolt current (v5.x). Minor version tweaks may be needed for the exact tag you pin.
#include "bannon_rig.h"
#include "bannon_arena.h"

#ifdef BANNON_USE_JOLT
#include <Jolt/Jolt.h>
#include <Jolt/Physics/PhysicsSystem.h>
#include <Jolt/Physics/Body/BodyCreationSettings.h>
#include <Jolt/Physics/Collision/Shape/CapsuleShape.h>
#include <Jolt/Physics/Collision/Shape/SphereShape.h>
#include <Jolt/Physics/Constraints/PointConstraint.h>

namespace bannon {

// object layers
namespace Layers { static constexpr JPH::ObjectLayer MOVING = 1; static constexpr JPH::ObjectLayer NON_MOVING = 0; }

class JoltRagdoll {
public:
    void init(JPH::PhysicsSystem* sys, const Vec3& origin = Vec3()) {
        mSys = sys;
        JPH::BodyInterface& bi = sys->GetBodyInterface();

        // one body per joint (small capsule/sphere), positioned at the rest layout
        for (int i = 0; i < JOINT_COUNT; ++i) {
            Vec3 p = JOINT_REST[i] + origin;
            float r = (i == J_HEAD) ? 0.13f : 0.07f;
            JPH::RefConst<JPH::Shape> shape = new JPH::SphereShape(r);
            JPH::BodyCreationSettings bcs(shape, JPH::RVec3(p.x, p.y, p.z), JPH::Quat::sIdentity(),
                                          JPH::EMotionType::Dynamic, Layers::MOVING);
            bcs.mOverrideMassProperties = JPH::EOverrideMassProperties::CalculateInertia;
            bcs.mMassPropertiesOverride.mMass = (i == J_PELVIS || i == J_CHEST) ? 12.0f : 4.0f;
            JPH::Body* b = bi.CreateBody(bcs);
            bi.AddBody(b->GetID(), JPH::EActivation::Activate);
            mBodyPtr[i] = b; mBody[i] = b->GetID();
        }
        // connect bones with point constraints along the hierarchy
        for (int i = 0; i < JOINT_COUNT; ++i) {
            int par = JOINT_PARENT[i];
            if (par < 0) continue;
            JPH::PointConstraintSettings s;
            Vec3 mid = (JOINT_REST[i] + JOINT_REST[par]) * 0.5f + origin;
            s.mPoint1 = s.mPoint2 = JPH::RVec3(mid.x, mid.y, mid.z);
            mSys->AddConstraint(s.Create(*mBodyPtr[par], *mBodyPtr[i]));
        }
    }

    void setPose(const Vec3 targets[JOINT_COUNT]) { for (int i = 0; i < JOINT_COUNT; ++i) mTarget[i] = targets[i]; }

    void applyHit(int joint, const Vec3& impulse, float damage) {
        mSys->GetBodyInterface().AddImpulse(mBody[joint], JPH::Vec3(impulse.x, impulse.y, impulse.z));
        mBlend[joint] = 0.35f;
        applyImpact(state, damage);
    }

    // PD motor as a force toward the animation target (torque-equivalent for the point-linked bodies)
    void preStep() {
        JPH::BodyInterface& bi = mSys->GetBodyInterface();
        for (int i = 0; i < JOINT_COUNT; ++i) {
            JPH::RVec3 p = bi.GetPosition(mBody[i]);
            JPH::Vec3  v = bi.GetLinearVelocity(mBody[i]);
            Vec3 err = mTarget[i] - Vec3((float)p.GetX(), (float)p.GetY(), (float)p.GetZ());
            float kp = 900.0f * mBlend[i], kd = 60.0f * mBlend[i];
            Vec3 f = err * kp - Vec3(v.GetX(), v.GetY(), v.GetZ()) * kd;
            bi.AddForce(mBody[i], JPH::Vec3(f.x, f.y, f.z));
            if (mBlend[i] < 1.0f) mBlend[i] = std::min(1.0f, mBlend[i] + 2.0f * FIXED_DT);
        }
    }

    Vec3 jointPos(int i) const {
        JPH::RVec3 p = mSys->GetBodyInterface().GetPosition(mBody[i]);
        return Vec3((float)p.GetX(), (float)p.GetY(), (float)p.GetZ());
    }

    WrestlerState state;

private:
    JPH::PhysicsSystem* mSys = nullptr;
    JPH::BodyID mBody[JOINT_COUNT];
    JPH::Body*  mBodyPtr[JOINT_COUNT] = {nullptr};
    Vec3  mTarget[JOINT_COUNT];
    float mBlend[JOINT_COUNT] = {1};
};

} // namespace bannon
#endif // BANNON_USE_JOLT
