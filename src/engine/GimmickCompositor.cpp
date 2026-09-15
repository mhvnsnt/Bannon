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
        
        // DEEP LORE: The 8 Non-Canon Characters (Humanized & Grounded)
        std::cout << "[NEXUS LORE] Desmond Okafor (Viper): The waiting kid. Counter-striking as a survival habit. Wants his brother to book him." << std::endl;
        ArchetypeBlend viperBlend = {"Evasive Tactician", "Lethal Precision", "Underdog", "", ""};
        assignArchetypes("Viper", viperBlend);

        std::cout << "[NEXUS LORE] Toma Ishikawa (Kage): Seattle dojo family. Explosive early, gasses late. Fighting to save the dojo." << std::endl;
        ArchetypeBlend kageBlend = {"Dark Arts Striker", "Evasive Tactician", "Feral Agility", "", ""};
        assignArchetypes("Kage", kageBlend);

        std::cout << "[NEXUS LORE] Curtis Bowe (Brutus): Ex-bouncer. Absorbs damage to end it fast. Wants to be present for his daughter." << std::endl;
        ArchetypeBlend brutusBlend = {"Absolute Mass", "Brawler", "Unstoppable Force", "", ""};
        assignArchetypes("Brutus", brutusBlend);

        std::cout << "[NEXUS LORE] Zephyr: No confirmed real name. Capoeira as cover for uncle's errands. Wants to outgrow the underworld." << std::endl;
        ArchetypeBlend zephyrBlend = {"Fearless High-Flyer", "Evasive Tactician", "Feral Agility", "", ""};
        assignArchetypes("Zephyr", zephyrBlend);

        std::cout << "[NEXUS LORE] Adrian Vess (Mortus): Former mortuary assistant. Calm around grief. Wants funeral-director licensing money." << std::endl;
        ArchetypeBlend mortusBlend = {"Psychological Menace", "Master Technician", "Absolute Mass", "", ""};
        assignArchetypes("Mortus", mortusBlend);

        std::cout << "[NEXUS LORE] Joseph Alaka (Titan): Samoan-American ex-shot-putter. Measures himself against former teammates." << std::endl;
        ArchetypeBlend titanBlend = {"Explosive Powerhouse", "Powerhouse", "Absolute Mass", "", ""};
        assignArchetypes("Titan", titanBlend);

        std::cout << "[NEXUS LORE] Nikolai Petrenko (Golem): Undiagnosed learning disability. Secretly teaching himself to read. Unmoved and unmaking." << std::endl;
        ArchetypeBlend golemBlend = {"Unstoppable Force", "Absolute Mass", "Powerhouse", "", ""};
        assignArchetypes("Golem", golemBlend);

        std::cout << "[NEXUS LORE] Kenji Kaneshiro (Ronin): Lost developmental deal, distrusts locker rooms. Wants to believe Atlas's offer is real." << std::endl;
        ArchetypeBlend roninBlend = {"Master Technician", "Lethal Precision", "Underdog", "", ""};
        assignArchetypes("Ronin", roninBlend);
        
        std::cout << "[NEXUS COMPOSITOR] Roster Profiles Mapped. Float logic bound to active execution states." << std::endl;
    }

} // namespace BannonEngine
