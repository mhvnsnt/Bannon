#include "ArchetypeStateManager.h"
#include <iostream>
#include <algorithm>

namespace BannonEngine {

    ArchetypeStateManager::ArchetypeStateManager(ArchetypeFloats initial) {
        currentFloats = initial;
        winStreak = 0;
        lossStreak = 0;
        holdsTitle = false;
    }

    void ArchetypeStateManager::recordMatchResult(bool win, bool isTitleMatch) {
        if (win) {
            winStreak++;
            lossStreak = 0;
            if (isTitleMatch) holdsTitle = true;
        } else {
            lossStreak++;
            winStreak = 0;
            if (isTitleMatch) holdsTitle = false;
        }
        rebalanceArchetypes();
    }

    void ArchetypeStateManager::rebalanceArchetypes() {
        // Example dynamic shifting:
        if (winStreak >= 3) {
            // Leach from tertiary/jobber traits, pour into dynamic momentum/unstoppable force
            float transfer = 0.05f * winStreak;
            currentFloats.tertiary = std::max(0.0f, currentFloats.tertiary - transfer);
            currentFloats.dynamicHidden = std::min(1.0f, currentFloats.dynamicHidden + transfer);
            std::cout << "[NEXUS MOMENTUM] Win streak detected. Shifted " << transfer << " into dynamic momentum float." << std::endl;
        } else if (lossStreak >= 3) {
            // Lose momentum, poise threshold becomes brittle
            float penalty = 0.05f * lossStreak;
            currentFloats.dynamicHidden = std::max(0.0f, currentFloats.dynamicHidden - penalty);
            std::cout << "[NEXUS MOMENTUM] Loss streak detected. Confidence penalty applied to physics poise." << std::endl;
        }

        if (holdsTitle) {
            // Absolute champion float override
            currentFloats.dynamicHidden = std::max(currentFloats.dynamicHidden, 0.40f);
        }
    }

    void ArchetypeStateManager::printCurrentState() {
        std::cout << "Archetype Array [P: " << currentFloats.primary 
                  << ", S: " << currentFloats.secondary 
                  << ", T: " << currentFloats.tertiary 
                  << ", H: " << currentFloats.dynamicHidden << "]" << std::endl;
    }

}
