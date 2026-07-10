#include "bannon_core.h"
#include "bannon_ragdoll.h"
#include <cstdio>
#include <cassert>

using namespace bannon;

int main() {
    int fails = 0;

    // --- poise-driven crumple, independent of HP ---
    WrestlerState w;
    applyImpact(w, 5.0f);
    assert(w.hp < MAX_HP && "hp should drop");
    assert(!w.crumpled && "one light hit shouldn't crumple");
    for (int i = 0; i < 40; ++i) applyImpact(w, 5.0f);
    assert(w.crumpled && "sustained poise damage crumples");
    printf("[ok] poise crumple: hp=%.0f poise=%.1f crumpled=%d\n", w.hp, w.poise, w.crumpled);

    // --- velocity cap ---
    RigidBody rb; rb.force = Vec3(1000, 0, 0);
    rb.integrate(FIXED_DT);
    assert(rb.vel.length() <= MAX_BODY_VEL + 1e-4f && "vel must be capped");
    printf("[ok] vel cap: %.3f <= %.3f\n", rb.vel.length(), MAX_BODY_VEL);

    // --- PD joint tracks its animation target (settles, no runaway) ---
    PDJoint j; j.body.pos = Vec3(0, 0, 0); j.target = Vec3(1, 0, 0);
    for (int i = 0; i < 240; ++i) j.drive(FIXED_DT);
    float e = (j.target - j.body.pos).length();
    printf("[%s] PD track: err=%.4f\n", e < 0.05f ? "ok" : "FAIL", e);
    if (e >= 0.05f) fails++;

    // --- bone clamp holds two joints at rest length ---
    RigidBody a, b; a.pos = Vec3(0,0,0); b.pos = Vec3(2.5f, 0, 0); // stretched
    for (int i = 0; i < 20; ++i) constrainBone(a, b, 0.4f);
    float bl = (b.pos - a.pos).length();
    printf("[%s] bone clamp: len=%.3f -> rest 0.4\n", (bl > 0.35f && bl < 0.45f) ? "ok" : "FAIL", bl);
    if (!(bl > 0.35f && bl < 0.45f)) fails++;

    // --- quaternion rotate sanity ---
    Quat q = Quat::fromAxisAngle(Vec3(0,1,0), 3.14159265f * 0.5f);
    Vec3 r = q.rotate(Vec3(1,0,0));
    printf("[%s] quat rot: (1,0,0)->(%.2f,%.2f,%.2f) ~ (0,0,-1)\n",
           (std::fabs(r.z + 1.0f) < 0.01f) ? "ok" : "FAIL", r.x, r.y, r.z);
    if (std::fabs(r.z + 1.0f) >= 0.01f) fails++;

    printf(fails ? "\n%d FAIL\n" : "\nALL PASS\n", fails);
    return fails ? 1 : 0;
}
