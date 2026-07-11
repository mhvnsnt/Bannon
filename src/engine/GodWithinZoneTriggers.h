#ifndef GOD_WITHIN_ZONE_TRIGGERS_H
#define GOD_WITHIN_ZONE_TRIGGERS_H

#include <iostream>
#include <string>
#include "GodWithinCampaign.h"

// ============================================================================
// BANNON ENGINE — ACT 1 ARENA ZONE PHYSICAL TRIGGERS
// ============================================================================
namespace BannonEngine {

    class GodWithinZoneTriggers {
    public:
        GodWithinZoneTriggers(GodWithinCampaign* campaignRef);
        ~GodWithinZoneTriggers();

        // Act 1 Openers - Physically walking into zones
        void enterLoadingDock();
        void enterTrainersRoom();
        void enterLowerLevelGarage();
        void enterOverflowStorage();
        void enterMedicalWing();
        void enterUpperConcourse();
        void enterMakeshiftWeightRoom();
        void enterDumpsterCorridor();

    private:
        GodWithinCampaign* campaign;
    };

} // namespace BannonEngine

#endif // GOD_WITHIN_ZONE_TRIGGERS_H
