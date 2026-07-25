#include "MetaphysicalSolver.h"
#include <iostream>

namespace BannonEngine {

    MetaphysicalSolver::MetaphysicalSolver() {
        baselineGravity = -9.81f;
    }

    void MetaphysicalSolver::applyOntologicalPhysicsOverride(OntologicalAlignment alignment, float& massMultiplier, float& frictionCoefficient, float& staminaDrainRate) {
        switch (alignment) {
            case OntologicalAlignment::HERMETIC_POLARITY:
                // The Principle of Polarity: Momentum shifts heavily
                massMultiplier *= 1.1f;
                frictionCoefficient *= 0.9f; 
                break;
            case OntologicalAlignment::KABBALISTIC_GEBURAH:
                // Severity / Strength: Massive damage output, brittle defense
                massMultiplier *= 1.3f;
                staminaDrainRate *= 1.2f;
                break;
            case OntologicalAlignment::KABBALISTIC_CHESED:
                // Mercy / Kindness: Superior submission escapes and recovery
                staminaDrainRate *= 0.7f;
                frictionCoefficient *= 1.1f;
                break;
            case OntologicalAlignment::BUDDHIST_DETACHMENT:
                // Karmic Detachment: Lower baseline stamina depletion, unaffected by psychological menace
                staminaDrainRate *= 0.6f;
                massMultiplier *= 1.0f;
                break;
            case OntologicalAlignment::KARMIC_ZEALOTRY:
                // Hyper-focused kinetic bursts
                massMultiplier *= 1.4f;
                frictionCoefficient *= 1.2f;
                break;
            case OntologicalAlignment::QUANTUM_OBSERVER:
                // Quantum State: Bounding box friction and mass are probabilistic
                massMultiplier *= 0.95f; 
                break;
            default:
                break;
        }
    }

    void MetaphysicalSolver::triggerParadigmShift(OntologicalAlignment currentAlignment, bool isDominatingMatch) {
        if (currentAlignment == OntologicalAlignment::HERMETIC_POLARITY && isDominatingMatch) {
            std::cout << "[NEXUS METAPHYSICS] Hermetic Polarity Shift: The pendulum swings. Momentum crystallized." << std::endl;
        }
    }

} // namespace BannonEngine
