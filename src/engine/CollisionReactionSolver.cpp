#include "CollisionReactionSolver.h"

namespace BannonEngine {

    CollisionReactionSolver::CollisionReactionSolver() : frictionConstraint(1.0f), staggerMultiplier(1.0f) {}
    CollisionReactionSolver::~CollisionReactionSolver() {}

    void CollisionReactionSolver::calculateHitReaction(const ArchetypeBlend& victimBlend, float incomingVelocity) {
        std::cout << "[NEXUS PHYSICS] Calculating Hit Reaction via Archetype Array..." << std::endl;
        
        // Evaluate the main archetype to shift the reaction
        if (victimBlend.primary == "Absolute Mass" || victimBlend.primary == "Powerhouse" || victimBlend.primary == "Unstoppable Force") {
            frictionConstraint = 0.9f; // Stay rooted
            staggerMultiplier = 0.1f;  // Minimal stagger
            std::cout << "[NEXUS PHYSICS] Archetype evaluation: Absolute Mass/Powerhouse detected." << std::endl;
            std::cout << "[NEXUS PHYSICS] Reaction: Friction constraint high. Absorbing kinetic impact." << std::endl;
        } else if (victimBlend.primary == "Showboater" || victimBlend.primary == "Comedy Bumper") {
            frictionConstraint = 0.0f; // Slip and slide
            staggerMultiplier = 2.5f;  // Huge flip bump
            std::cout << "[NEXUS PHYSICS] Archetype evaluation: Showboater/Comedy Bumper detected." << std::endl;
            std::cout << "[NEXUS PHYSICS] Reaction: Zero friction. Executing exaggerated flip bump." << std::endl;
        } else if (victimBlend.primary == "Underdog" || victimBlend.primary == "Feral Agility") {
            frictionConstraint = 0.5f;
            staggerMultiplier = 1.2f;
            std::cout << "[NEXUS PHYSICS] Archetype evaluation: Underdog/Feral Agility detected." << std::endl;
            std::cout << "[NEXUS PHYSICS] Reaction: Standard stagger back with dynamic defensive recovery." << std::endl;
        } else {
            // Default baseline
            std::cout << "[NEXUS PHYSICS] Archetype evaluation: Standard profile detected." << std::endl;
            std::cout << "[NEXUS PHYSICS] Reaction: Standard ragdoll crumple mapped." << std::endl;
        }
    }

} // namespace BannonEngine
