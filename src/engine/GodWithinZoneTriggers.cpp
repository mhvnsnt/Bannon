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

} // namespace BannonEngine
