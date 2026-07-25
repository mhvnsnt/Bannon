#ifndef GIMMICK_COMPOSITOR_H
#define GIMMICK_COMPOSITOR_H

#include <iostream>
#include <string>
#include <vector>

// ============================================================================
// BANNON ENGINE — GIMMICK COMPOSITOR MASTER ARRAY
// ============================================================================
namespace BannonEngine {

    // Defines the 5-tier structural DNA for any Canon or Non-Canon roster member
    struct ArchetypeBlend {
        std::string primary;
        std::string secondary;
        std::string tertiary;
        std::string sub1;
        std::string sub2;
    };

    class GimmickCompositor {
    public:
        GimmickCompositor();
        ~GimmickCompositor();

        // Assigns the 5-block archetype to the active character rig
        void assignArchetypes(const std::string& characterName, const ArchetypeBlend& blend);

        // Pre-calculates the final float array for the physics engine
        void compilePhysicsMultipliers();
        // Pre-loads the Canon and Non-Canon rosters into the active memory
        void initializeRosterProfiles();

    private:
        ArchetypeBlend activeBlend;
        std::string currentCharacter;
    };

} // namespace BannonEngine

#endif // GIMMICK_COMPOSITOR_H
