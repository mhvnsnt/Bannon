#include "bannon_strike.h"
#include "bannon_grapple.h"
#include <cstdio>

using namespace bannon;

int main() {
    int fails = 0;

    // --- STRIKE: a hard strike drives poise down; repeated strikes crumple, HP tracks separately ---
    Ragdoll def; def.init();
    Vec3 pose[JOINT_COUNT]; for (int i = 0; i < JOINT_COUNT; ++i) pose[i] = JOINT_REST[i];
    def.setPose(pose); for (int f = 0; f < 60; ++f) def.step();
    float hp0 = def.state.hp, poise0 = def.state.poise;
    Strike jab{ J_HEAD, 6.0f, 5.0f };            // headshot, fast limb
    for (int n = 0; n < 30; ++n) { resolveStrike(def, jab, Vec3(-1, 0.2f, 0)); for (int f = 0; f < 8; ++f) def.step(); }
    printf("[%s] strike->poise/hp: hp %.0f->%.0f  poise %.0f->%.0f  crumpled=%d\n",
           (def.state.hp < hp0 && def.state.crumpled) ? "ok" : "FAIL", hp0, def.state.hp, poise0, def.state.poise, def.state.crumpled);
    if (!(def.state.hp < hp0 && def.state.crumpled)) fails++;

    // --- GRAPPLE: attacker stronger + defender not mashing -> hold persists; then heavy mash -> escape ---
    Ragdoll atk; atk.init(Vec3(0.5f, 0, 0)); Ragdoll vic; vic.init();
    atk.setPose(pose); vic.setPose(pose);
    GrappleSolver gs; gs.engage(J_HAR, J_HAL);
    bool held = true;
    for (int f = 0; f < 120 && held; ++f) { held = gs.step(atk, vic, /*atkStam*/0.9f, /*defStam*/0.5f, /*mash*/0.0f); atk.step(); vic.step(); }
    bool stillHeld = gs.g.active;
    // victim's locked hand should be pulled toward attacker's grip hand
    float lockDist = (vic.jointPos(J_HAL) - atk.jointPos(J_HAR)).length();
    printf("[%s] grapple hold: active=%d  lockedHand->grip dist=%.3f  tension=%.0f\n",
           (stillHeld && lockDist < 0.25f) ? "ok" : "FAIL", stillHeld, lockDist, gs.g.gripTension);
    if (!(stillHeld && lockDist < 0.25f)) fails++;

    // now the victim mashes hard -> tension drains -> escape
    bool escaped = false;
    for (int f = 0; f < 400; ++f) { if (!gs.step(atk, vic, 0.4f, 0.9f, 1.0f)) { escaped = true; break; } atk.step(); vic.step(); }
    printf("[%s] grapple escape on mash: escaped=%d  tension=%.0f\n", escaped ? "ok" : "FAIL", escaped, gs.g.gripTension);
    if (!escaped) fails++;

    printf(fails ? "\n%d FAIL\n" : "\nALL PASS\n", fails);
    return fails ? 1 : 0;
}
