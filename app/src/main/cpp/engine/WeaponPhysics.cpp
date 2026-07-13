#include "WeaponPhysics.h"
#include "WeaponDiagnostics.h"
#include <iostream>

void WeaponPhysics::pickupWeapon(const BaseWeapon& weapon, float characterStamina, float armDamage) {
    std::cout << "[WeaponPhysics] Picked up " << weapon.name << " (Mass: " << weapon.mass << "kg)\n";
    if (armDamage > 50.0f) {
        std::cout << "[WeaponPhysics] INJURY DRAG: Arms are heavily damaged. Character physically struggles to hoist " << weapon.name << ".\n";
    }
    std::cout << "[WeaponPhysics] Dual-point IK arm constraint established. Center of mass shifted backward to balance load.\n";
    
    WeaponDiagnostics::enableBackendDebugDraw();
    WeaponDiagnostics::renderKinematicLinkVisualization(weapon.mass, -0.15f);
}

void WeaponPhysics::executeWeaponStrike(const BaseWeapon& weapon, float targetVelocity, bool isMiss, bool isReversed, float& characterStamina, float armDamage) {
    std::cout << "[WeaponPhysics] Executing strike with " << weapon.name << " at target velocity " << targetVelocity << "m/s.\n";
    
    WeaponDiagnostics::renderPredictedSwingArc(0.0f, 1.5f, 1.0f, 1.0f, (weapon.mass * targetVelocity) * 0.5f);
    
    // Injury Multiplier
    float injuryMultiplier = (armDamage > 50.0f) ? 2.5f : 1.0f;
    float actualVelocity = (armDamage > 50.0f) ? targetVelocity * 0.6f : targetVelocity; // Swing speed severely capped if injured
    
    // Universal Mass-Tax
    float baseStaminaCost = (weapon.mass * actualVelocity) * injuryMultiplier;
    float finalStaminaCost = baseStaminaCost;
    
    WeaponDiagnostics::logStaminaDrainCalculation(weapon.mass, targetVelocity, actualVelocity, injuryMultiplier, baseStaminaCost);
    
    if (injuryMultiplier > 1.0f) {
        std::cout << "[WeaponPhysics] INJURY DRAG: Severe arm damage limits swing velocity to " << actualVelocity << "m/s. Exponential stamina cost applied.\n";
    }

    std::string collisionTarget = "Opponent";
    float impactForce = weapon.mass * actualVelocity * 8.0f;

    if (isReversed) {
        // Kinetic Shock
        float reversalShock = 15.0f; // Flat percentage shock
        finalStaminaCost += reversalShock;
        std::cout << "[WeaponPhysics] KINETIC SHOCK: Strike reversed! Momentum physically intercepted. Applying flat reversal shock drain.\n";
        WeaponDiagnostics::logWeaponImpact(0.0f, finalStaminaCost, "Opponent (Blocked/Reversed)", false, true);
    } else if (isMiss) {
        // Momentum Whiff
        finalStaminaCost *= 2.5f;
        std::cout << "[WeaponPhysics] MOMENTUM WHIFF: Strike missed. Physical energy absorbed by joints to stop swing. 2.5x stamina cost applied.\n";
        std::cout << "[WeaponPhysics] BALANCE OVER-CORRECT: Kinetic energy pulls upper-body ragdoll out of position. Forward stumble triggered.\n";
        WeaponDiagnostics::logWeaponImpact(0.0f, finalStaminaCost, "Air/Static Geometry", true, false);
    } else {
        // Clean Hit
        std::cout << "[WeaponPhysics] Kinetic transfer successful. High Poise shock inflicted via DMG_SCALE=8.0.\n";
        WeaponDiagnostics::logWeaponImpact(impactForce, finalStaminaCost, "Opponent", false, false);
    }

    characterStamina -= finalStaminaCost;
    if (characterStamina < 0.0f) characterStamina = 0.0f;

    std::cout << "[WeaponPhysics] Total Stamina Deducted: " << finalStaminaCost << ". Remaining Stamina: " << characterStamina << "\n";
    
    if (characterStamina == 0.0f) {
        std::cout << "[WeaponPhysics] CRITICAL EXHAUSTION: Stamina depleted to absolute zero. Severing hand constraints, dropping weapon, and entering localized crumple state.\n";
    }
}
