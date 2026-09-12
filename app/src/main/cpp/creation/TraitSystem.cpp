#include <iostream>
#include <string>

class TraitSystem {
public:
    struct FighterStats {
        float bodyMass;
        float maxBodyVel;
        float poise;
        float staminaDecayMultiplier;
        std::string subType;
    };

    FighterStats applyTraits(float baseMass, const std::string& archetype, const std::string& subType) {
        FighterStats stats;
        stats.bodyMass = baseMass;
        stats.subType = subType;
        
        // Baseline assumptions based on pure mass
        stats.maxBodyVel = 4.0f - (baseMass * 0.005f); // Heavier = slower
        stats.poise = baseMass * 0.2f;                // Heavier = more poise
        stats.staminaDecayMultiplier = 1.0f;

        std::cout << "[TRAIT SYSTEM] Evaluating Base DNA for: " << archetype << " (" << baseMass << "lbs)" << std::endl;

        if (subType == "Agile Heavyweight" || subType == "Feral Agility") {
            std::cout << " -> OVERRIDE: Agile Heavyweight / Feral Agility detected." << std::endl;
            stats.maxBodyVel += 1.5f; // Bypass mass restriction
            stats.staminaDecayMultiplier = 2.5f; // Heavy stamina tax for flying at massive weight
            std::cout << " -> MAX_BODY_VEL dynamically boosted. Stamina tax increased to x" << stats.staminaDecayMultiplier << std::endl;
        } 
        else if (subType == "Ground-Based Luchador" || subType == "Mat Technician") {
            std::cout << " -> OVERRIDE: Ground-Based Luchador detected." << std::endl;
            stats.maxBodyVel -= 0.8f; // Trades aerial speed for ground game
            stats.poise += 15.0f;     // Harder to break their holds
            stats.staminaDecayMultiplier = 0.8f; // Efficient mat wrestling
            std::cout << " -> MAX_BODY_VEL restricted. Poise enhanced. Stamina tax reduced to x" << stats.staminaDecayMultiplier << std::endl;
        }

        std::cout << "[TRAIT SYSTEM] Final Physics Constraints -> VEL: " << stats.maxBodyVel 
                  << " | POISE: " << stats.poise << " | STAMINA TAX: " << stats.staminaDecayMultiplier << "\n" << std::endl;
                  
        return stats;
    }
};
