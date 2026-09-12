#pragma once
// BANNON native rig — the 15-joint active ragdoll. Rest layout + bone hierarchy + PD drive toward
// animation targets + bone constraints. Backend-agnostic: runs on the tested positional solver now,
// and each joint maps 1:1 to a Jolt body when BANNON_USE_JOLT is on (see bannon_jolt.h).
#include "bannon_core.h"
#include "bannon_ragdoll.h"

namespace bannon {

// parent of each joint (‑1 = root). Drives bone constraints + Jolt constraint graph.
static const int JOINT_PARENT[JOINT_COUNT] = {
    -1,        // pelvis
    J_PELVIS,  // chest
    J_CHEST,   // head
    J_CHEST, J_SHL, J_ELL,   // shL, elL, haL
    J_CHEST, J_SHR, J_ELR,   // shR, elR, haR
    J_PELVIS, J_HIPL, J_KNL, // hipL, knL, ftL
    J_PELVIS, J_HIPR, J_KNR  // hipR, knR, ftR
};

// rest positions (metres, y-up) — athletic ~1.85m frame, matches the web rig proportions
static const Vec3 JOINT_REST[JOINT_COUNT] = {
    { 0.00f, 0.95f, 0.00f}, // pelvis
    { 0.00f, 1.32f, 0.00f}, // chest
    { 0.00f, 1.70f, 0.00f}, // head
    { 0.18f, 1.42f, 0.00f}, {  0.30f, 1.15f, 0.00f}, {  0.34f, 0.90f, 0.00f}, // L arm
    {-0.18f, 1.42f, 0.00f}, { -0.30f, 1.15f, 0.00f}, { -0.34f, 0.90f, 0.00f}, // R arm
    { 0.11f, 0.92f, 0.00f}, {  0.13f, 0.50f, 0.00f}, {  0.13f, 0.05f, 0.00f}, // L leg
    {-0.11f, 0.92f, 0.00f}, { -0.13f, 0.50f, 0.00f}, { -0.13f, 0.05f, 0.00f}  // R leg
};

struct Ragdoll {
    PDJoint joints[JOINT_COUNT];
    float   boneLen[JOINT_COUNT];   // rest length to parent
    WrestlerState state;

    void init(const Vec3& origin = Vec3()) {
        for (int i = 0; i < JOINT_COUNT; ++i) {
            joints[i].body.pos = joints[i].body.prevPos = JOINT_REST[i] + origin;
            joints[i].target   = JOINT_REST[i] + origin;
            joints[i].body.vel = Vec3();
            int p = JOINT_PARENT[i];
            boneLen[i] = (p >= 0) ? (JOINT_REST[i] - JOINT_REST[p]).length() : 0.0f;
        }
    }

    // feed one animation pose frame (world targets per joint)
    void setPose(const Vec3 targets[JOINT_COUNT]) {
        for (int i = 0; i < JOINT_COUNT; ++i) joints[i].target = targets[i];
    }

    // an impact impulse on one joint, plus poise/HP; drops that limb's motor blend so it gives naturally
    void applyHit(int joint, const Vec3& impulse, float damage) {
        joints[joint].body.vel += impulse;
        joints[joint].blend = 0.35f;            // hit limb goes semi-limp, recovers below
        applyImpact(state, damage);
    }

    // fixed-step: PD-drive every joint, hold bones, recover motor blend
    void step() {
        for (int i = 0; i < JOINT_COUNT; ++i) joints[i].drive(FIXED_DT);
        // 3 constraint iterations keep limbs attached (native version of the render clamp)
        for (int it = 0; it < 3; ++it)
            for (int i = 0; i < JOINT_COUNT; ++i) {
                int p = JOINT_PARENT[i];
                if (p >= 0) constrainBone(joints[p].body, joints[i].body, boneLen[i], 0.9f);
            }
        for (int i = 0; i < JOINT_COUNT; ++i)
            if (joints[i].blend < 1.0f) joints[i].blend = std::min(1.0f, joints[i].blend + 2.0f * FIXED_DT);
        regenStamina(state, /*idle*/ false);
    }

    Vec3 jointPos(int i) const { return joints[i].body.pos; }
};

} // namespace bannon
