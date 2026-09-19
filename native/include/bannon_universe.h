#pragma once
// BANNON native — UNIVERSE / MODES layer (real implementations of the "bannonengine_2" design
// specs: trait subtype physics, TLC environmental physics, Iron Man wear, crowd kinetic reaction,
// GM booking math, locker-room friction politics, God Within consequence rules).
// The drop's C++ was cout-narrative; these are the actual functions, tested in test_universe.cpp.
#include "bannon_core.h"
#include "bannon_math.h"
#include <cstring>

namespace bannon {

// ── TRAIT / ARCHETYPE SUBTYPE OVERRIDES ──────────────────────────────────────────────────────────
// Subtypes bend the mass→speed law WITHOUT breaking the immutable MAX_BODY_VEL cap: an "agile
// heavyweight" flies like a cruiser but pays a heavy stamina tax; a mat technician trades top
// speed for poise and stamina efficiency. Pure function: mass (kg) + subtype → physics multipliers.
enum TraitSubtype { T_NONE = 0, T_AGILE_HEAVY, T_MAT_TECH };
struct TraitMods {
    float velScale;      // × on locomotion/aerial speed (final speed still clamped to MAX_BODY_VEL)
    float poiseBonus;    // flat poise added
    float staminaTax;    // × on all stamina costs
    bool  aerialUnlock;  // heavyweights normally locked out of springboards; subtype bypass
};
inline TraitMods traitMods(float massKg, TraitSubtype t) {
    TraitMods m{1.0f, 0.0f, 1.0f, massKg < 110.f};   // <110 kg fliers are unrestricted by default
    // baseline mass law: heavier = slower (gentle: −0.35% per kg over 80)
    float over = massKg > 80.f ? (massKg - 80.f) : 0.f;
    m.velScale = 1.0f - over * 0.0035f;
    if (m.velScale < 0.55f) m.velScale = 0.55f;
    switch (t) {
        case T_AGILE_HEAVY:                          // bypass the mass restriction, pay in gas
            m.velScale += 0.30f;
            if (m.velScale > 1.0f) m.velScale = 1.0f; // never faster than a fresh cruiser
            m.staminaTax = 2.5f;
            m.aerialUnlock = true;
            break;
        case T_MAT_TECH:                             // trade speed for grounded control
            m.velScale -= 0.15f;
            m.poiseBonus = 15.0f;
            m.staminaTax = 0.8f;
            break;
        default: break;
    }
    return m;
}

// ── TLC ENVIRONMENTAL PHYSICS ────────────────────────────────────────────────────────────────────
// Table: shatters when kinetic force (mass × impact velocity) beats the structural threshold;
// a shatter is a big poise shock + localized spine damage to the victim. Bounce otherwise.
struct TableImpact { bool shattered; float poiseShock; float spineDamage; };
inline TableImpact tableImpact(float victimMassKg, float velY /* downward, m/s, positive */,
                               float tableThresholdN = 350.f) {
    TableImpact r{};
    float v = velY > MAX_BODY_VEL ? MAX_BODY_VEL : (velY < 0.f ? 0.f : velY);
    float force = victimMassKg * v;
    r.shattered = force > tableThresholdN;
    if (r.shattered) {
        r.poiseShock  = v * DMG_SCALE * 2.2f;        // tables are poise bombs
        r.spineDamage = force * 0.9f;                // localized (spine), NOT generic HP
    } else {
        r.poiseShock  = v * DMG_SCALE * 0.6f;        // rigid bounce still stings
        r.spineDamage = 0.f;
    }
    return r;
}
// Ladder climb: rung-binding gate — you can only bind hand/foot IK to rungs when close enough,
// facing the ladder, and not gassed flat (climbing at zero stamina fails organically).
inline bool canBindLadderClimb(const Vec3& fighterPos, const Vec3& ladderPos,
                               const Vec3& fighterFacing, float stamFrac) {
    Vec3 to = ladderPos - fighterPos; to.y = 0;
    if (to.length() > 0.85f) return false;
    if (fighterFacing.normalized().dot(to.normalized()) < 0.45f) return false;
    return stamFrac > 0.08f;
}

// ── IRON MAN FALL WEAR ───────────────────────────────────────────────────────────────────────────
// After a scored fall the loser's HP pool resets, but physiological wear is permanent for the
// match: a stamina penalty per fall lost (compounding fatigue is what makes hour-long matches
// swing late). Returns the loser's new stamina.
inline float ironManFallReset(WrestlerState& loser, int fallsLostSoFar) {
    loser.hp = MAX_HP;                               // pools reset
    loser.crumpled = false;
    float wear = 0.35f + 0.05f * (float)(fallsLostSoFar - 1);  // 35% first fall, +5% per further
    if (wear > 0.6f) wear = 0.6f;
    loser.stamina -= MAX_STAMINA * wear;
    if (loser.stamina < MAX_STAMINA * 0.1f) loser.stamina = MAX_STAMINA * 0.1f; // never fully dead
    return loser.stamina;
}

// ── CROWD KINETIC REACTION ───────────────────────────────────────────────────────────────────────
// The crowd listens to solver telemetry, not scripted beats: pops scale on real impact velocity.
enum CrowdEvent { CE_WEAPON_IMPACT, CE_HIGH_ARC_THROW, CE_BOTCH_OR_STALL, CE_DYNAMIC_PIN, CE_NONE };
// Returns pop intensity −10..10 (negative = boos/heat).
inline int crowdReaction(CrowdEvent e, float impactVel) {
    float v = impactVel > MAX_BODY_VEL ? MAX_BODY_VEL : impactVel;
    switch (e) {
        case CE_WEAPON_IMPACT:  return v > 2.0f ? (v > 3.2f ? 9 : 7) : 3;
        case CE_HIGH_ARC_THROW: return v > 3.5f ? 10 : (v > 2.5f ? 6 : 2);
        case CE_BOTCH_OR_STALL: return -6;
        case CE_DYNAMIC_PIN:    return 5;
        default: return 0;
    }
}

// ── GM MODE BOOKING MATH ─────────────────────────────────────────────────────────────────────────
// Show rating from real match telemetry; rating maps to revenue; injuries spike short-term shock
// value but cost roster morale. Pure math, drives the Universe auto-booker.
struct ShowResult { float rating; float revenue; float moraleDelta; };
inline ShowResult scoreShow(bool extremeStips /*HARDCORE/FIRST_BLOOD/TLC*/, float maxImpactVel,
                            bool criticalInjury, int frictionSpikes) {
    ShowResult r{50.f, 0.f, 0.f};
    if (extremeStips && maxImpactVel > 3.5f) r.rating += 25.f;
    else if (maxImpactVel > 3.0f)            r.rating += 12.f;
    if (criticalInjury) { r.rating += 10.f; r.moraleDelta -= 18.f; }
    r.moraleDelta -= 6.f * (float)frictionSpikes;
    if (r.rating > 100.f) r.rating = 100.f;
    r.revenue = r.rating * 15000.f;
    return r;
}

// ── FRICTION POLITICS (locker-room heat → shoot AI) ──────────────────────────────────────────────
// Going off-script drains the cooperation index and builds heat; below the cooperation floor the
// CPU opponent goes into SHOOT mode (dead-weights grapples, stiffs strikes); past the heat
// threshold the auto-booker retaliates (slow counts, mutiny risk).
struct PoliticsState { float cooperation = 100.f; float heat = 0.f; };
struct PoliticsEffects { bool shootAI; bool slowCounts; float mutinyChance; };
inline PoliticsEffects processAction(PoliticsState& p, bool scripted) {
    if (!scripted) { p.cooperation -= 40.f; p.heat += 25.f; }
    else { p.cooperation += 5.f; if (p.cooperation > 100.f) p.cooperation = 100.f; }
    if (p.cooperation < 0.f) p.cooperation = 0.f;
    PoliticsEffects e{};
    e.shootAI      = p.cooperation <= 50.f;
    e.slowCounts   = p.heat >= 50.f;
    e.mutinyChance = p.heat >= 50.f ? 0.35f : 0.f;
    return e;
}

// ── GOD WITHIN CONSEQUENCE RULES ─────────────────────────────────────────────────────────────────
// A broken IK constraint in-match is a career event: injury duration scales on the over-torque,
// titles are stripped when the injury outlasts the defense window, and a revenge storyline seed is
// planted. Pure decision function — the roster/story arrays apply it.
struct Consequence {
    int  injuryMonths;      // 0 = walked away
    bool stripTitles;       // out past the 60-day defense window
    bool revengeSeed;       // storyline flag: victim returns for the attacker
};
inline Consequence matchConsequence(bool constraintBroken, float overTorque01 /*0..1 severity*/) {
    Consequence c{0, false, false};
    if (!constraintBroken) return c;
    float s = overTorque01 < 0.f ? 0.f : (overTorque01 > 1.f ? 1.f : overTorque01);
    c.injuryMonths = 1 + (int)(s * 8.f);             // 1..9 months by severity
    c.stripTitles  = c.injuryMonths > 2;             // >60 days = can't defend
    c.revengeSeed  = true;                           // the books run on this
    return c;
}

} // namespace bannon
