#include "GodWithinZoneTriggers.h"

namespace BannonEngine {

    GodWithinZoneTriggers::GodWithinZoneTriggers(GodWithinCampaign* campaignRef) : campaign(campaignRef) {}
    GodWithinZoneTriggers::~GodWithinZoneTriggers() {}

    void GodWithinZoneTriggers::enterLoadingDock() {
        std::cout << "[ZONE TRIGGER] Entered: Loading Dock. Damp night air. Distant arena thud." << std::endl;
        std::cout << "[ENCOUNTER] Julian Kaneshiro (Ronin) detected." << std::endl;
        campaign->triggerCinematicTransition(TransitionEffect::GLITCH_SHATTER);
    }

    void GodWithinZoneTriggers::enterTrainersRoom() {
        std::cout << "[ZONE TRIGGER] Entered: Trainer's Room. Wintergreen and old sweat." << std::endl;
        std::cout << "[ENCOUNTER] Desmond Okafor (Viper) detected." << std::endl;
        campaign->triggerCinematicTransition(TransitionEffect::HORIZONTAL_SLICE);
    }

    void GodWithinZoneTriggers::enterLowerLevelGarage() {
        std::cout << "[ZONE TRIGGER] Entered: Lower Level Garage. Damp heat." << std::endl;
        std::cout << "[ENCOUNTER] Curtis Bowe (Brutus) detected." << std::endl;
        campaign->triggerCinematicTransition(TransitionEffect::DIGITAL_STATIC_WAVE);
    }

    void GodWithinZoneTriggers::enterOverflowStorage() {
        std::cout << "[ZONE TRIGGER] Entered: Overflow Storage (Boiler Room). Dark maze of steel." << std::endl;
        std::cout << "[ENCOUNTER] Nikolai Petrenko (Golem) detected." << std::endl;
        campaign->triggerCinematicTransition(TransitionEffect::WHITE_ASH_DISSOLVE);
    }

    void GodWithinZoneTriggers::enterMedicalWing() {
        std::cout << "[ZONE TRIGGER] Entered: Medical Wing Corridor. Dead center calmness." << std::endl;
        std::cout << "[ENCOUNTER] Adrian Vess (Mortus) detected." << std::endl;
        campaign->triggerCinematicTransition(TransitionEffect::GLITCH_SHATTER);
    }

    void GodWithinZoneTriggers::enterUpperConcourse() {
        std::cout << "[ZONE TRIGGER] Entered: Upper Concourse Warm-up. Concrete and thin mats." << std::endl;
        std::cout << "[ENCOUNTER] Toma Ishikawa (Kage) detected." << std::endl;
        campaign->triggerCinematicTransition(TransitionEffect::WHITE_ASH_DISSOLVE);
    }

    void GodWithinZoneTriggers::enterMakeshiftWeightRoom() {
        std::cout << "[ZONE TRIGGER] Entered: Makeshift Weight Room. Chalk and iron." << std::endl;
        std::cout << "[ENCOUNTER] Joseph Alaka (Titan) detected." << std::endl;
        campaign->triggerCinematicTransition(TransitionEffect::TYPEWRITER_FOG);
    }

    void GodWithinZoneTriggers::enterDumpsterCorridor() {
        std::cout << "[ZONE TRIGGER] Entered: Corridor to Dumpsters. Camera dead zone." << std::endl;
        std::cout << "[ENCOUNTER] Zephyr detected." << std::endl;
        campaign->triggerCinematicTransition(TransitionEffect::DIGITAL_STATIC_WAVE);
    }

    void GodWithinZoneTriggers::enterCatwalks() {
        std::cout << "[ZONE TRIGGER] Entered: Catwalks. Liminal space. 90ft drop." << std::endl;
        std::cout << "[ENCOUNTER] Sombra Negra detected." << std::endl;
        campaign->triggerCinematicTransition(TransitionEffect::DIGITAL_STATIC_WAVE);
    }

    void GodWithinZoneTriggers::enterVoidDream() {
        std::cout << "[ZONE TRIGGER] Entered: Void Dream. Obsidian mat, infinite darkness." << std::endl;
        std::cout << "[ENCOUNTER] Solaris Justice detected." << std::endl;
        campaign->triggerCinematicTransition(TransitionEffect::GLITCH_SHATTER);
    }

    void GodWithinZoneTriggers::enterTapeArchive() {
        std::cout << "[ZONE TRIGGER] Entered: Tape Archive. Claustrophobic, decaying magnetic tape." << std::endl;
        std::cout << "[ENCOUNTER] Cain Elias (Paranoia Remix) detected." << std::endl;
        campaign->triggerCinematicTransition(TransitionEffect::WHITE_ASH_DISSOLVE);
    }

    void GodWithinZoneTriggers::enterHallOfMirrors() {
        std::cout << "[ZONE TRIGGER] Entered: Hall of Mirrors. Warped geometry, polished glass." << std::endl;
        std::cout << "[ENCOUNTER] Toma Ishikawa (Kage - Remixed Oni) detected." << std::endl;
        campaign->triggerCinematicTransition(TransitionEffect::HORIZONTAL_SLICE);
    }

    void GodWithinZoneTriggers::enterShowerBlock() {
        std::cout << "[ZONE TRIGGER] Entered: Shower Block. Steam, wet tile, flickering tubes." << std::endl;
        std::cout << "[ENCOUNTER] Adrian Vess (Mortus - Drowned Remix) detected." << std::endl;
        campaign->triggerCinematicTransition(TransitionEffect::DIGITAL_STATIC_WAVE);
    }

    void GodWithinZoneTriggers::enterArenaRoof() {
        std::cout << "[ZONE TRIGGER] Entered: Arena Roof. Peaceful, cold wind, city skyline." << std::endl;
        std::cout << "[ENCOUNTER] Stick Up (Awakened Remix) detected." << std::endl;
        campaign->triggerCinematicTransition(TransitionEffect::WHITE_ASH_DISSOLVE);
    }

    void GodWithinZoneTriggers::enterSubBasement() {
        std::cout << "[ZONE TRIGGER] Entered: Sub-Basement Generator Room. Oppressive heat." << std::endl;
        std::cout << "[ENCOUNTER] Atlas Vance (Burned Kingdom Remix) detected." << std::endl;
        campaign->triggerCinematicTransition(TransitionEffect::GLITCH_SHATTER);
    }

    void GodWithinZoneTriggers::enterVIPSkybox() {
        std::cout << "[ZONE TRIGGER] Entered: VIP Skybox. Psychedelic slow-motion." << std::endl;
        std::cout << "[ENCOUNTER] Desmond Okafor (Viper - Hollow Ego Remix) detected." << std::endl;
        campaign->triggerCinematicTransition(TransitionEffect::TYPEWRITER_FOG);
    }

} // namespace BannonEngine
