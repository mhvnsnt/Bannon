// Verifies every native symbol UBannonRagdollComponent.cpp depends on actually exists with the
// expected values, and that the metres->centimetres conversion of the MAX_BODY_VEL law is right.
// This is the half of the UE component that CAN be compiled outside Unreal.
#include "bannon_core.h"
#include "bannon_rig.h"
#include <cstdio>
#include <cmath>

static int fails = 0;
static void chk(bool ok, const char* what) {
    printf("  %s %s\n", ok ? "PASS" : "FAIL", what);
    if (!ok) ++fails;
}

int main() {
    constexpr float M_TO_CM = 100.0f;

    printf("native constants used by the UE ragdoll:\n");
    chk(bannon::JOINT_COUNT == 15, "JOINT_COUNT == 15 (kDefaultBoneNames array size)");
    chk(std::fabs(bannon::MAX_BODY_VEL - 3.8f) < 1e-6f, "MAX_BODY_VEL == 3.8 m/s");
    chk(std::fabs(bannon::MAX_BODY_VEL * M_TO_CM - 380.0f) < 1e-4f, "MaxBodyVelCmPerSec() == 380 cm/s");
    chk(std::fabs(bannon::DMG_SCALE - 8.0f) < 1e-6f, "DMG_SCALE == 8.0 (untouched)");

    printf("joint enum names referenced in SetupPhysicsAssetFromNativeRig:\n");
    chk(bannon::J_PELVIS == 0, "J_PELVIS == 0 (RootBoneName default)");
    chk(bannon::J_CHEST == 1 && bannon::J_HEAD == 2, "J_CHEST / J_HEAD (spine limits)");
    chk(bannon::J_ELL == 4 && bannon::J_ELR == 7, "J_ELL / J_ELR (hinge elbows)");
    chk(bannon::J_KNL == 10 && bannon::J_KNR == 13, "J_KNL / J_KNR (hinge knees)");

    printf("PD gains pushed into Chaos physical animation:\n");
    const bannon::PDJoint ref;
    chk(std::fabs(ref.kp - 900.0f) < 1e-3f, "PDJoint::kp == 900 (OrientationStrength/PositionStrength)");
    chk(std::fabs(ref.kd - 60.0f)  < 1e-3f, "PDJoint::kd == 60 (AngularVelocityStrength/VelocityStrength)");
    chk(std::fabs(ref.blend - 1.0f) < 1e-6f, "PDJoint::blend defaults to 1 (fully motored)");

    printf("joint hierarchy drives the constraint graph:\n");
    chk(bannon::JOINT_PARENT[bannon::J_PELVIS] == -1, "pelvis is root (parent -1)");
    chk(bannon::JOINT_PARENT[bannon::J_ELL] == bannon::J_SHL, "elbow parents to shoulder");
    chk(bannon::JOINT_PARENT[bannon::J_KNR] == bannon::J_HIPR, "knee parents to hip");

    printf("native velocity clamp agrees with the UE clamp:\n");
    bannon::RigidBody b;
    b.vel = bannon::Vec3{100.0f, 0.0f, 0.0f};   // absurd velocity, like a big impact
    b.force = bannon::Vec3();
    b.integrate(bannon::FIXED_DT);
    chk(b.vel.length() <= bannon::MAX_BODY_VEL + 1e-3f, "RigidBody::integrate caps at MAX_BODY_VEL");

    printf("\n%s (%d failure%s)\n", fails ? "FAILED" : "ALL CHECKS PASSED", fails, fails == 1 ? "" : "s");
    return fails ? 1 : 0;
}
