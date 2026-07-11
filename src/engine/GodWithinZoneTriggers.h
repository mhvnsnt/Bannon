#ifndef GOD_WITHIN_ZONE_TRIGGERS_H
#define GOD_WITHIN_ZONE_TRIGGERS_H

#include <iostream>
#include <string>
#include "GodWithinCampaign.h"

// ============================================================================
// BANNON ENGINE — ARENA ZONE PHYSICAL TRIGGERS
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

        // Act 2 Liminal & Surreal Zones
        void enterCatwalks();
        void enterVoidDream();
        void enterTapeArchive();
        void enterHallOfMirrors();
        void enterShowerBlock();
        void enterArenaRoof();
        void enterSubBasement();
        void enterVIPSkybox();
        void enterHospitalitySuite();

        // Act 3 MDickie Sandbox & Phase-Shift Zones
        void enterLoadingBayHandoff();
        void enterFreightElevator();
        void enterServerFarm();
        void enterMainEvent();
        
        // Roaming Zones & Grounded Transformations
        void enterConcreteBowels();
        void enterLoadingDockTunnels();
        void enterLoadingDockGrounded();
        void enterEquipmentLockUp();
        void enterBoilerRoomGrounded();
        void enterInterviewSet();
        void enterStorageBay();
        void enterPropGraveyard();
        
        // Executive Corridor
        void enterExecutiveCorridor();

    private:
        GodWithinCampaign* campaign;
    };

} // namespace BannonEngine

#endif // GOD_WITHIN_ZONE_TRIGGERS_H
