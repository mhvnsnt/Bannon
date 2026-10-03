#ifndef ONTOLOGICAL_KNOWLEDGE_BASE_H
#define ONTOLOGICAL_KNOWLEDGE_BASE_H

#include <string>
#include <map>
#include <vector>

namespace BannonEngine {

    enum class EsotericDiscipline {
        HERMETICISM,
        KABBALAH,
        ASTROLOGY,
        QUANTUM_PHYSICS,
        BUDDHISM,
        HINDUISM
    };

    struct OntologicalPrinciple {
        std::string name;
        EsotericDiscipline discipline;
        std::string description;
        float defaultPhysicsInfluence;
        float volatility; // How much this principle fluctuates via Quantum Chaos
    };

    class OntologicalKnowledgeBase {
    public:
        OntologicalKnowledgeBase();
        
        // Load the deep esoteric database
        void initializeDeepResearch();

        // Query a principle by name
        OntologicalPrinciple getPrinciple(const std::string& name);

        // Fetch physics modifiers based on active astrological alignments or esoteric states
        float computeAstrologicalGravityShift(const std::string& currentSign);
        
        // Computes how the Tree of Life influences the damage sponge/poise of a character
        float computeSephiroticPoise(const std::string& activeSephirah);

    private:
        std::map<std::string, OntologicalPrinciple> principlesMap;
    };

}

#endif // ONTOLOGICAL_KNOWLEDGE_BASE_H
