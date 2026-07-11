#ifndef GOD_MODE_OS_DAEMON_H
#define GOD_MODE_OS_DAEMON_H

#include "../engine/QuantumChaosEngine.h"
#include "../engine/GematriaCalculator.h"
#include "../engine/GimmickCompositor.h"
#include "EvolutionMatrix.h"
#include <memory>
#include <string>

// ============================================================================
// BANNON ENGINE — NATIVE C++ GOD MODE OS DAEMON
// ============================================================================

namespace BannonEngine {

    class GodModeOSDaemon {
    public:
        GodModeOSDaemon(const std::string& dbPath);
        ~GodModeOSDaemon();

        // Boot up the overarching OS
        void bootOS();
        
        // Execute a complete match cycle evaluation (Learning, Memory, Chaos)
        void processMatchConclusion(const std::string& characterUuid, const std::string& characterName, bool isWinner, float matchIntensity, float karmicShift);
        
        // Fetch current active multipliers for the physics engine
        float getRuntimePhysicsMultiplier(const std::string& characterUuid, const std::string& characterName, ArchetypeType primaryGimmick);

    private:
        std::unique_ptr<QuantumChaosEngine> quantumEngine;
        std::unique_ptr<EvolutionMatrix> evolutionMatrix;
        std::unique_ptr<GimmickCompositor> compositor;
        bool isOnline;
    };

} // namespace BannonEngine

#endif // GOD_MODE_OS_DAEMON_H
