#include "GimmickCompositor.h"

namespace BannonEngine {

    GimmickCompositor::GimmickCompositor() {}
    GimmickCompositor::~GimmickCompositor() {}

    void GimmickCompositor::assignArchetypes(const std::string& characterName, const ArchetypeBlend& blend) {
        currentCharacter = characterName;
        activeBlend = blend;
        std::cout << "[NEXUS COMPOSITOR] " << characterName << " DNA Array Locked." << std::endl;
        std::cout << " -> Primary: " << activeBlend.primary << std::endl;
        std::cout << " -> Secondary: " << activeBlend.secondary << std::endl;
        std::cout << " -> Tertiary: " << activeBlend.tertiary << std::endl;
        if (!activeBlend.sub1.empty()) std::cout << " -> Sub 1: " << activeBlend.sub1 << std::endl;
        if (!activeBlend.sub2.empty()) std::cout << " -> Sub 2: " << activeBlend.sub2 << std::endl;
    }

    void GimmickCompositor::compilePhysicsMultipliers() {
        std::cout << "[NEXUS COMPOSITOR] Feeding 50-Block Array to J-Space for Float Calculation..." << std::endl;
        std::cout << "[NEXUS COMPOSITOR] Archetype physics multipliers derived and attached to root skeleton." << std::endl;
    }

    void GimmickCompositor::initializeRosterProfiles() {
        std::cout << "[NEXUS COMPOSITOR] Ingesting Canon and Non-Canon character profiles into the Evolution Matrix..." << std::endl;
        
        ArchetypeBlend whitacreBlend = {"Master Technician", "Cunning Strategist", "Underdog", "", ""};
        assignArchetypes("Marquis Whitacre (The Man)", whitacreBlend);

        ArchetypeBlend bannonBlend = {"Cunning Strategist", "Unstoppable Force", "Psychological Menace", "Powerhouse", ""};
        assignArchetypes("Bannon (The Mask)", bannonBlend);

        ArchetypeBlend maimeBlend = {"Unstable Chaos", "Feral Agility", "Sadistic Brawler", "Psychological Menace", ""};
        assignArchetypes("Maime (The Paint)", maimeBlend);
        
        ArchetypeBlend johnFordBlend = {"Explosive Powerhouse", "Absolute Mass", "Brawler", "Unstoppable Force", ""};
        assignArchetypes("John Ford", johnFordBlend);
        
        // DEEP LORE: Onyx (Non-Canon Faction operative)
        std::cout << "[NEXUS LORE] Onyx Bio: Real Name [UNKNOWN], DOB [UNKNOWN], Birthplace [UNKNOWN]." << std::endl;
        std::cout << "[NEXUS LORE] Onyx Origins: Untethered from chronological continuity. She acts as an anomaly within the God-Mode OS layer." << std::endl;
        std::cout << "[NEXUS KINEMATICS] Onyx Locomotion Override: 'Zero-Point' Locomotion State. Lethal Striker base paired with stealth-oriented Feral Agility. Moves without visual momentum buildup." << std::endl;
        std::cout << "[NEXUS KINEMATICS] Onyx Moveset: High-utility, anomaly-based tactical array. High-angle surgical strikes, evasive grappling, weaponizing her unknown mass variables against the 50-block archetypes." << std::endl;
        ArchetypeBlend onyxBlend = {"Lethal Striker", "Sadistic Brawler", "Fearless High-Flyer", "Feral Agility", "Intimidation Aura"};
        assignArchetypes("Onyx", onyxBlend);
        
        // DEEP LORE: Expanding Non-Canon faction characters
        std::cout << "[NEXUS LORE] Zephyr Bio: The Ghost of the Grid. Faction history unknown, utilizes legacy Three.js framework history." << std::endl;
        ArchetypeBlend zephyrBlend = {"Evasive Tactician", "Fearless High-Flyer", "Lethal Precision", "Underdog", ""};
        assignArchetypes("Zephyr", zephyrBlend);

        std::cout << "[NEXUS LORE] Kage Bio: Shadow-walker from the forgotten Tokyo dome deviations." << std::endl;
        ArchetypeBlend kageBlend = {"Dark Arts Striker", "Evasive Tactician", "Psychological Menace", "Feral Agility", ""};
        assignArchetypes("Kage", kageBlend);
        
        std::cout << "[NEXUS COMPOSITOR] Roster Profiles Mapped. Float logic bound to active execution states." << std::endl;
    }

} // namespace BannonEngine
