#pragma once
// BANNON native — the THREE-PERSONA state machine (God Within). Marquis / Bannon / Maime are ONE fighter
// whose physics multipliers swap, not three characters (Book 5 already made Maime a distinct feral combat
// mode). This is the shared hook the story mode + skill tree (Geburah=Maime, Chesed=Marquis branches) drive.
#include "bannon_core.h"
#include "bannon_math.h"
#include "bannon_strike.h"

namespace bannon {

enum Persona { P_MARQUIS = 0, P_BANNON, P_MAIME };

struct PersonaMods {
    float damageMult;        // outgoing force scale
    float staggerThreshold;  // impact needed to stagger THIS fighter (high = resistant)
    float counterWindow;     // reversal/parry window scale (high = best reads)
    float speedMult;         // movement/attack speed
    float dashJitter;        // erratic dash perturbation amplitude (Maime only)
    float impactVelCap;      // per-connect velocity cap (Maime maxes it out)
};

// The tuning table. Marquis = fragile/technical, Bannon = resilient/heavy, Maime = feral/erratic/max-impact.
inline PersonaMods personaMods(Persona p) {
    switch (p) {
        case P_BANNON:  return { 1.20f, 3.4f, 0.55f, 0.90f, 0.00f, MAX_BODY_VEL };
        case P_MAIME:   return { 1.45f, 2.0f, 0.45f, 1.05f, 0.35f, MAX_BODY_VEL };
        case P_MARQUIS:
        default:        return { 0.85f, 1.2f, 1.00f, 1.00f, 0.00f, MAX_BODY_VEL * 0.85f };
    }
}

// Scale a strike by the acting persona (Maime also drives the connect toward the impact-velocity cap).
inline Strike applyPersona(const Persona p, Strike s) {
    PersonaMods m = personaMods(p);
    s.baseForce   *= m.damageMult;
    if (s.limbVelocity > m.impactVelCap) s.limbVelocity = m.impactVelCap;
    else if (p == P_MAIME) s.limbVelocity = m.impactVelCap;   // feral: always max connect
    return s;
}

// Does an incoming impact stagger a fighter in persona p? Bannon eats far more before hitstun.
inline bool staggers(Persona p, float impact) { return impact > personaMods(p).staggerThreshold; }

// Erratic dash: Maime's movement gets a deterministic (seeded) perturbation — he doesn't telegraph because
// he doesn't know his own trajectory either. Marquis/Bannon return the dash unchanged.
inline Vec3 applyDashJitter(Persona p, const Vec3& dash, unsigned seed) {
    float amp = personaMods(p).dashJitter;
    if (amp < 1e-5f) return dash;
    // cheap deterministic hash -> [-1,1] per axis
    auto h = [](unsigned x){ x ^= x >> 16; x *= 0x7feb352dU; x ^= x >> 15; x *= 0x846ca68bU; x ^= x >> 16;
                             return (float)(x & 0xffff) / 32768.0f - 1.0f; };
    Vec3 j(h(seed), h(seed * 2654435761U + 1U), h(seed * 40503U + 7U));
    return dash + j * (amp * dash.length());
}

} // namespace bannon
