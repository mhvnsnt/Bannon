#include "GodWithinCampaign.h"

namespace BannonEngine {

    GodWithinCampaign::GodWithinCampaign() 
        : corruptionMeter(0.0f), purityMeter(0.0f), autonomyMeter(0.0f), maimeStateUnlocked(false) {}

    GodWithinCampaign::~GodWithinCampaign() {}

    void GodWithinCampaign::addCorruption(float amount) {
        corruptionMeter += amount;
        std::cout << "[GOD WITHIN] Corruption increased to: " << corruptionMeter << std::endl;
        checkAct3Threshold(); // Constantly poll for Act 3 Maime-State unlock
    }

    void GodWithinCampaign::addPurity(float amount) { purityMeter += amount; }
    void GodWithinCampaign::addAutonomy(float amount) { autonomyMeter += amount; }
    
    void GodWithinCampaign::updateTrust(const std::string& characterId, float amount) {
        trustMeters[characterId] += amount;
    }

    void GodWithinCampaign::checkAct3Threshold() {
        if (corruptionMeter >= 75.0f && !maimeStateUnlocked) {
            maimeStateUnlocked = true;
            std::cout << "[GOD WITHIN] CRITICAL: Corruption threshold crossed. Maime-State UNLOCKED." << std::endl;
            std::cout << "[GOD WITHIN] POV Shift available. Visceral physics engine overridden with 'Feral Menace' matrix." << std::endl;
        }
    }

    bool GodWithinCampaign::canRenderOnyx() {
        if (maimeStateUnlocked) {
            std::cout << "[GOD WITHIN] RENDER HOOK: Onyx model visibility ENABLED. Loading unclocked anomaly mesh." << std::endl;
            return true;
        }
        return false;
    }

    void GodWithinCampaign::enterSeamlessSandboxCombat(const std::string& targetCharacter, const std::string& environmentZone) {
        std::cout << "[GOD WITHIN] ENGAGING SEAMLESS SANDBOX BRAWL: " << targetCharacter << " in " << environmentZone << std::endl;
        std::cout << "[GOD WITHIN] Camera shifting from over-the-shoulder to dynamic combat tracking." << std::endl;
        std::cout << "[GOD WITHIN] Physics shifted to MDickie/Neckbreaker environmental sandbox rules." << std::endl;
        std::cout << "[GOD WITHIN] Environmental weapons active." << std::endl;
    }

    void GodWithinCampaign::throwCharacterFromHeight(const std::string& targetCharacter, float dropHeight, bool canSurvive) {
        std::cout << "[GOD WITHIN] MDICKIE PHYSICS: " << targetCharacter << " thrown from height of " << dropHeight << " ft!" << std::endl;
        if (!canSurvive || dropHeight >= 90.0f) {
            std::cout << "[GOD WITHIN] OUTCOME: " << targetCharacter << " is incapacitated/dead. Removed from current session." << std::endl;
        } else {
            std::cout << "[GOD WITHIN] OUTCOME: " << targetCharacter << " survives with severe injuries. Can return in later acts." << std::endl;
        }
    }

    void GodWithinCampaign::triggerCinematicTransition(TransitionEffect effect) {
        std::cout << "[GOD WITHIN] Transition Triggered: Black Screen." << std::endl;
        std::cout << "THE GOD WITHIN" << std::endl;
        switch (effect) {
            case TransitionEffect::GLITCH_SHATTER:
                std::cout << "-> (Effect: Text tears into frame, glitches violently, burns into white ash)" << std::endl;
                break;
            case TransitionEffect::WHITE_ASH_DISSOLVE:
                std::cout << "-> (Effect: Text glows like heated iron, shatters into razor-thin lines into the void)" << std::endl;
                break;
            case TransitionEffect::HORIZONTAL_SLICE:
                std::cout << "-> (Effect: White vertical line slices darkness, text drops like a steel gate, evaporates like mist)" << std::endl;
                break;
            case TransitionEffect::DIGITAL_STATIC_WAVE:
                std::cout << "-> (Effect: Digital static wave rolls horizontally, pulling text into blackness)" << std::endl;
                break;
            case TransitionEffect::TYPEWRITER_FOG:
                std::cout << "-> (Effect: Text types out with mechanical clacks, blurs into a white fog)" << std::endl;
                break;
            case TransitionEffect::NEON_SHATTER:
                std::cout << "-> (Effect: Neon tubing flashes, buzzes loudly, violently shatters outward)" << std::endl;
                break;
            case TransitionEffect::BLOOD_RAIN_WASH:
                std::cout << "-> (Effect: Blood on lens washed away by sudden heavy rain)" << std::endl;
                break;
        }
    }

    void GodWithinCampaign::triggerLocalizedAudio(const std::string& ambientNoise, const std::string& glitchEffect) {
        std::cout << "[AUDIO SYSTEM] Area Ambient: " << ambientNoise << std::endl;
        std::cout << "[AUDIO SYSTEM] Spatial Glitch FX: " << glitchEffect << " triggered on proximity." << std::endl;
    }

    void GodWithinCampaign::enableRigidBodyPhysics(const std::string& objectType) {
        std::cout << "[PHYSICS ENGINE] Rigid body dynamics activated for: " << objectType << std::endl;
        std::cout << "-> Object now reacts dynamically to Bannon's collision hull (kick, shove, trample)." << std::endl;
    }

    void GodWithinCampaign::examineLoreNode(const std::string& documentName) {
        std::cout << "[INVESTIGATION] Inspecting: " << documentName << std::endl;
        std::cout << "-> LORE UNLOCKED: Onyx's ledger reveals script manipulation. 'They built the whole house on numbers.'" << std::endl;
    }

    void GodWithinCampaign::spawnDynamicEncounter(const std::string& location) {
        std::cout << "[PATHFINDING] Recalculating route back to: " << location << std::endl;
        float currentCorrupt = getCorruption();
        if (currentCorrupt >= 60.0f) {
            std::cout << "[DYNAMIC ENCOUNTER] High Corruption: Hostile 'Cannon' Cody Callahan (Cannonball Brawler) intercepts." << std::endl;
        } else if (currentCorrupt >= 30.0f) {
            std::cout << "[DYNAMIC ENCOUNTER] Med Corruption: Paranoid lower-card rookie attacks from shadows." << std::endl;
        } else {
            std::cout << "[DYNAMIC ENCOUNTER] Low Corruption: Neutral encounter. Maintenance crew flees the area." << std::endl;
        }
    }

    void GodWithinCampaign::unlockTyneshiaPlayable() {
        std::cout << "[SYSTEM] Queen Tyneshia unlocked as a fully playable POV character!" << std::endl;
        std::cout << "[SYSTEM] Tyneshia acts as the Anchor of Reality, breaking Feral Menace domains. Available in Act 4 and NG+." << std::endl;
    }

} // namespace BannonEngine
