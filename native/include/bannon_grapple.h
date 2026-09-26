#pragma once
// BANNON native grappling — real physics limb-lock. The defender's locked joint is kinematically driven
// to the attacker's grip point (weight transfers into the hold), grip tension drains over time and with
// the defender's mashing, leverage swings on the stamina differential, and the hold breaks on tension-out
// or a leverage reversal. This is the Masson/2K-style active grapple: no canned animation, pure state.
#include "bannon_rig.h"

namespace bannon {

struct Grapple {
    int   attackerJoint = J_HAR;   // attacker's controlling hand
    int   defenderJoint = J_HAL;   // locked joint on the defender
    float gripTension   = 100.0f;
    float leverage      = 0.0f;    // + = attacker winning, - = defender reversing
    bool  active        = false;
};

struct GrappleSolver {
    Grapple g;
    float escapeThreshold = 85.0f;

    void engage(int atkJoint, int defJoint) {
        g.attackerJoint = atkJoint; g.defenderJoint = defJoint;
        g.gripTension = 100.0f; g.leverage = 0.0f; g.active = true;
    }

    // one fixed step. Returns true while the hold persists.
    // atkStam/defStam 0..1, mashRate 0..1 (defender's escape input this step).
    bool step(Ragdoll& atk, Ragdoll& def, float atkStam, float defStam, float mashRate) {
        if (!g.active) return false;

        // kinematic lock: defender's locked joint is driven onto the attacker's grip point (weight into the hold)
        def.joints[g.defenderJoint].target = atk.jointPos(g.attackerJoint);
        def.joints[g.defenderJoint].blend  = 1.0f;

        // leverage tracks the stamina differential; tension drains over time and with mashing
        g.leverage    += (atkStam - defStam) * 6.0f * FIXED_DT;
        g.gripTension -= (2.5f + mashRate * 35.0f) * FIXED_DT;
        // attacker spends stamina holding; defender loses poise while controlled
        atk.state.stamina = std::max(0.0f, atk.state.stamina - 8.0f * FIXED_DT);
        def.state.poise   = std::max(0.0f, def.state.poise   - 3.0f * FIXED_DT);

        if (g.gripTension <= 0.0f || g.leverage < -escapeThreshold) {
            g.active = false;
            def.joints[g.defenderJoint].blend = 0.6f;   // released — limb springs back
            return false;
        }
        return true;
    }

    bool broken() const { return !g.active; }
};

} // namespace bannon
