#include "bannon_rig.h"
#include "bannon_arena.h"
#include <cstdio>
#include <cmath>

using namespace bannon;

int main() {
    int fails = 0;

    // build the 15-joint ragdoll, hold a T-pose (targets = rest)
    Ragdoll rd; rd.init();
    Vec3 pose[JOINT_COUNT]; for (int i = 0; i < JOINT_COUNT; ++i) pose[i] = JOINT_REST[i];
    rd.setPose(pose);
    for (int f = 0; f < 240; ++f) rd.step();

    float maxErr = 0, maxBone = 0;
    for (int i = 0; i < JOINT_COUNT; ++i) {
        maxErr = std::max(maxErr, (rd.jointPos(i) - JOINT_REST[i]).length());
        int p = JOINT_PARENT[i];
        if (p >= 0) maxBone = std::max(maxBone, std::fabs((rd.jointPos(i) - rd.jointPos(p)).length() - rd.boneLen[i]));
    }
    printf("[%s] 15-joint hold: maxErr=%.4f  maxBoneDrift=%.4f\n", (maxErr < 0.05f && maxBone < 0.02f) ? "ok" : "FAIL", maxErr, maxBone);
    if (!(maxErr < 0.05f && maxBone < 0.02f)) fails++;

    // hit the right hand: limb gives, then motor recovers back toward target
    rd.applyHit(J_HAR, Vec3(-3.0f, 1.0f, 0.0f), 6.0f);
    float peak = 0;
    for (int f = 0; f < 60; ++f) { rd.step(); peak = std::max(peak, (rd.jointPos(J_HAR) - JOINT_REST[J_HAR]).length()); }
    for (int f = 0; f < 240; ++f) rd.step();
    float rec = (rd.jointPos(J_HAR) - JOINT_REST[J_HAR]).length();
    printf("[%s] hit give+recover: peak=%.3f -> recovered=%.3f  poise=%.0f\n", (rec < peak && rec < 0.08f) ? "ok" : "FAIL", peak, rec, rd.state.poise);
    if (!(rec < peak && rec < 0.08f)) fails++;

    // arena: ring rebounds a body at the ropes; open lets it travel far
    Arena ring; ring.mode = RING_4; ring.halfSize = 3.0f;
    Vec3 p(5.0f, 0.5f, 0), v(2.0f, 0, 0);
    bool hitRing = ring.contain(p, v);
    printf("[%s] ring bound: x clamped to %.2f (<=3), rebounded=%d\n", (std::fabs(p.x) <= 3.01f && hitRing) ? "ok" : "FAIL", p.x, hitRing);
    if (!(std::fabs(p.x) <= 3.01f && hitRing)) fails++;

    Arena open; open.mode = OPEN; open.openHalf = 30.0f;
    Vec3 op(20.0f, 0.5f, 0), ov(1,0,0);
    bool hitOpen = open.contain(op, ov);
    printf("[%s] God Within open: x=20 free (no bound hit=%d)\n", (!hitOpen && op.x == 20.0f) ? "ok" : "FAIL", hitOpen);
    if (hitOpen) fails++;

    printf(fails ? "\n%d FAIL\n" : "\nALL PASS\n", fails);
    return fails ? 1 : 0;
}
