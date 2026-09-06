#ifndef ARCHETYPE_STATE_MANAGER_H
#define ARCHETYPE_STATE_MANAGER_H

#include <string>

// ============================================================================
// BANNON ENGINE — DYNAMIC ARCHETYPE STATE MANAGER
// ============================================================================

namespace BannonEngine {

    struct ArchetypeFloats {
        float primary;
        float secondary;
        float tertiary;
        float dynamicHidden; // Fluctuates based on storyline momentum
    };

    class ArchetypeStateManager {
    public:
        ArchetypeFloats currentFloats;
        int winStreak;
        int lossStreak;
        bool holdsTitle;

        ArchetypeStateManager(ArchetypeFloats initial);

        // Processes storyline/match outcomes
        void recordMatchResult(bool win, bool isTitleMatch);
        
        // Dynamically shifts floats (e.g. Jobber -> Underdog on win streak)
        void rebalanceArchetypes();
        
        void printCurrentState();
    };

}

#endif // ARCHETYPE_STATE_MANAGER_H
