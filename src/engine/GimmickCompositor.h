#ifndef GIMMICK_COMPOSITOR_H
#define GIMMICK_COMPOSITOR_H

#include <string>
#include <map>

// ============================================================================
// BANNON ENGINE — NATIVE C++ GIMMICK COMPOSITOR
// ============================================================================

namespace BannonEngine {

    enum class ArchetypeType {
        NONE,
        PSYCHOLOGICAL_MENACE,
        UNSTOPPABLE_FORCE,
        FERAL_AGILITY,
        UNDERDOG,
        CULT_LEADER,
        BRAWLER,
        DAMAGE_SPONGE,
        SUPERNATURAL_INTIMIDATION,
        POWERHOUSE,
        POISE_REGENERATOR,
        APEX_OPPORTUNIST,
        TECHNICIAN,
        LETHAL_PRECISION,
        DARK_ARTS_STRIKER,
        HIGH_RISK_STRIKER,
        UNSTABLE_CHAOS,
        HARDCORE_MASOCHIST,
        PAIN_CONVERSION,
        FEARLESS_HIGH_FLYER,
        CUNNING_STRATEGIST,
        SHOWBOATER,
        EVASIVE_TACTICIAN,
        ABSOLUTE_MASS,
        KINETIC_WALL,
        EXPLOSIVE_POWERHOUSE,
        CORPORATE_SHIELD,
        INTIMIDATION_AURA,
        SADISTIC_BRAWLER,
        MASTER_TECHNICIAN,
        ENDURANCE_SPECIALIST,
        LETHAL_STRIKER,
        MOMENTUM_SURGE,
        COMEDY_BUMPER,
        EVASIVE_LUCK,
        JOBBER // Structural vulnerability
    };

    struct GimmickBlend {
        ArchetypeType primary;
        ArchetypeType secondary;
        ArchetypeType tertiary;
        ArchetypeType dynamicFourth;

        float primaryWeight;
        float secondaryWeight;
        float tertiaryWeight;
        float dynamicFourthWeight;
    };

    class GimmickCompositor {
    public:
        GimmickCompositor();

        // Calculate final physics modifiers based on the blended archetypes
        float calculatePoiseModifier(const GimmickBlend& blend);
        float calculateEvasionProbability(const GimmickBlend& blend);
        float calculateKineticAbsorption(const GimmickBlend& blend);
        float calculateStaminaDrainRate(const GimmickBlend& blend);

    private:
        std::map<ArchetypeType, float> poiseModifiers;
        std::map<ArchetypeType, float> evasionModifiers;
        std::map<ArchetypeType, float> kineticAbsorptionModifiers;
        std::map<ArchetypeType, float> staminaModifiers;

        void initializeModifiers();
    };

} // namespace BannonEngine

#endif // GIMMICK_COMPOSITOR_H
