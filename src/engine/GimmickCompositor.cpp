#include "GimmickCompositor.h"
#include <iostream>

namespace BannonEngine {

    GimmickCompositor::GimmickCompositor() {
        initializeModifiers();
    }

    void GimmickCompositor::initializeModifiers() {
        // Base value is 1.0f. Below/Above 1.0f modifies the attribute.
        
        // Poise Modifiers
        poiseModifiers[ArchetypeType::UNSTOPPABLE_FORCE] = 1.5f;
        poiseModifiers[ArchetypeType::ABSOLUTE_MASS] = 1.8f;
        poiseModifiers[ArchetypeType::JOBBER] = 0.5f;
        poiseModifiers[ArchetypeType::UNDERDOG] = 0.8f;
        
        // Evasion Modifiers
        evasionModifiers[ArchetypeType::EVASIVE_TACTICIAN] = 1.4f;
        evasionModifiers[ArchetypeType::FERAL_AGILITY] = 1.3f;
        evasionModifiers[ArchetypeType::EVASIVE_LUCK] = 1.5f;
        evasionModifiers[ArchetypeType::ABSOLUTE_MASS] = 0.6f;
        
        // Kinetic Absorption Modifiers
        kineticAbsorptionModifiers[ArchetypeType::DAMAGE_SPONGE] = 1.6f;
        kineticAbsorptionModifiers[ArchetypeType::PAIN_CONVERSION] = 1.4f;
        kineticAbsorptionModifiers[ArchetypeType::KINETIC_WALL] = 1.7f;
        kineticAbsorptionModifiers[ArchetypeType::JOBBER] = 0.4f;
        
        // Stamina Modifiers (lower is better stamina retention)
        staminaModifiers[ArchetypeType::ENDURANCE_SPECIALIST] = 0.7f;
        staminaModifiers[ArchetypeType::PSYCHOLOGICAL_MENACE] = 0.8f;
        staminaModifiers[ArchetypeType::EXPLOSIVE_POWERHOUSE] = 1.3f;
        staminaModifiers[ArchetypeType::UNSTABLE_CHAOS] = 1.2f;
    }

    float GimmickCompositor::calculatePoiseModifier(const GimmickBlend& blend) {
        float modifier = 1.0f; // Base poise
        
        auto applyWeight = [&](ArchetypeType type, float weight) {
            if (poiseModifiers.count(type)) {
                // Blend the modifier based on weight (e.g. 0.45, 0.30, 0.15, 0.10)
                modifier += (poiseModifiers[type] - 1.0f) * weight;
            }
        };

        applyWeight(blend.primary, blend.primaryWeight);
        applyWeight(blend.secondary, blend.secondaryWeight);
        applyWeight(blend.tertiary, blend.tertiaryWeight);
        applyWeight(blend.dynamicFourth, blend.dynamicFourthWeight);

        return modifier;
    }

    float GimmickCompositor::calculateEvasionProbability(const GimmickBlend& blend) {
         float modifier = 1.0f;
         auto applyWeight = [&](ArchetypeType type, float weight) {
            if (evasionModifiers.count(type)) {
                modifier += (evasionModifiers[type] - 1.0f) * weight;
            }
        };
        applyWeight(blend.primary, blend.primaryWeight);
        applyWeight(blend.secondary, blend.secondaryWeight);
        applyWeight(blend.tertiary, blend.tertiaryWeight);
        applyWeight(blend.dynamicFourth, blend.dynamicFourthWeight);
        return modifier;
    }

    float GimmickCompositor::calculateKineticAbsorption(const GimmickBlend& blend) {
         float modifier = 1.0f;
         auto applyWeight = [&](ArchetypeType type, float weight) {
            if (kineticAbsorptionModifiers.count(type)) {
                modifier += (kineticAbsorptionModifiers[type] - 1.0f) * weight;
            }
        };
        applyWeight(blend.primary, blend.primaryWeight);
        applyWeight(blend.secondary, blend.secondaryWeight);
        applyWeight(blend.tertiary, blend.tertiaryWeight);
        applyWeight(blend.dynamicFourth, blend.dynamicFourthWeight);
        return modifier;
    }

    float GimmickCompositor::calculateStaminaDrainRate(const GimmickBlend& blend) {
         float modifier = 1.0f;
         auto applyWeight = [&](ArchetypeType type, float weight) {
            if (staminaModifiers.count(type)) {
                modifier += (staminaModifiers[type] - 1.0f) * weight;
            }
        };
        applyWeight(blend.primary, blend.primaryWeight);
        applyWeight(blend.secondary, blend.secondaryWeight);
        applyWeight(blend.tertiary, blend.tertiaryWeight);
        applyWeight(blend.dynamicFourth, blend.dynamicFourthWeight);
        return modifier;
    }

} // namespace BannonEngine
