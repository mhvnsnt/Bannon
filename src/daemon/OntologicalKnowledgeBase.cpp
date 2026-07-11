#include "OntologicalKnowledgeBase.h"
#include <iostream>

namespace BannonEngine {

    OntologicalKnowledgeBase::OntologicalKnowledgeBase() {
        initializeDeepResearch();
    }

    void OntologicalKnowledgeBase::initializeDeepResearch() {
        std::cout << "[NEXUS RESEARCH] Ingesting deep esoteric and ontological databases..." << std::endl;

        // HERMETICISM
        principlesMap["PrincipleOfPolarity"] = {
            "The Principle of Polarity", 
            EsotericDiscipline::HERMETICISM, 
            "Everything is dual; everything has poles. Momentum in a match naturally swings back with equal force.",
            1.2f, // Influence multiplier
            0.15f // Volatility
        };
        principlesMap["PrincipleOfRhythm"] = {
            "The Principle of Rhythm", 
            EsotericDiscipline::HERMETICISM, 
            "The pendulum swing manifests in everything. Dictates the ebb and flow of stamina regeneration.",
            0.9f, 
            0.05f
        };

        // KABBALAH
        principlesMap["Geburah"] = {
            "Geburah (Severity/Strength)", 
            EsotericDiscipline::KABBALAH, 
            "The essence of judgment and power. Uncaps kinetic output vectors but makes poise brittle.",
            1.4f, 
            0.2f
        };
        principlesMap["Chesed"] = {
            "Chesed (Mercy/Loving-kindness)", 
            EsotericDiscipline::KABBALAH, 
            "The essence of expansion and grace. Enhances evasion, submission escapes, and structural resilience.",
            0.7f, 
            0.05f
        };
        principlesMap["Keter"] = {
            "Keter (The Crown)", 
            EsotericDiscipline::KABBALAH, 
            "The highest state. Often associated with the 'God Within' mode threshold. Unknowable momentum.",
            3.0f, 
            0.5f
        };

        // BUDDHISM / HINDUISM
        principlesMap["KarmicDetachment"] = {
            "Karmic Detachment", 
            EsotericDiscipline::BUDDHISM, 
            "Severing reaction from action. Wrestlers in this state drain almost zero stamina from opponent's psychological menace.",
            0.5f, 
            0.0f
        };
        principlesMap["KundaliniAwakening"] = {
            "Kundalini Awakening", 
            EsotericDiscipline::HINDUISM, 
            "Primal energy rising from the base of the spine. Translates to massive, explosive velocity spikes late in the match.",
            1.6f, 
            0.25f
        };

        // QUANTUM PHYSICS
        principlesMap["QuantumSuperposition"] = {
            "Quantum Superposition", 
            EsotericDiscipline::QUANTUM_PHYSICS, 
            "The state of being in multiple places until observed. Used in the physics engine for erratic evasion and hitboxes.",
            1.0f, 
            0.4f
        };
        principlesMap["HeisenbergUncertainty"] = {
            "Heisenberg Uncertainty", 
            EsotericDiscipline::QUANTUM_PHYSICS, 
            "Cannot know both momentum and position simultaneously. The faster a Blackheart moves, the harder their hitbox is to calculate.",
            1.1f, 
            0.3f
        };

        std::cout << "[NEXUS RESEARCH] Deep ontology mapped. Principles loaded into C++ physics space." << std::endl;
    }

    OntologicalPrinciple OntologicalKnowledgeBase::getPrinciple(const std::string& name) {
        if (principlesMap.count(name)) {
            return principlesMap[name];
        }
        return {"Unknown", EsotericDiscipline::QUANTUM_PHYSICS, "Unmapped ontological sector.", 1.0f, 0.0f};
    }

    float OntologicalKnowledgeBase::computeAstrologicalGravityShift(const std::string& currentSign) {
        // e.g., if the real-world calendar or match setting is in Aries, gravity is lighter, strikes are faster.
        // If Taurus, gravity is heavy, slams do more damage.
        if (currentSign == "Aries") return 0.95f; // Faster, aggressive
        if (currentSign == "Taurus") return 1.05f; // Heavy, grounded
        if (currentSign == "Gemini") return 0.98f; // Erratic
        if (currentSign == "Scorpio") return 1.02f; // Psychological, intense
        return 1.0f; // Baseline
    }

    float OntologicalKnowledgeBase::computeSephiroticPoise(const std::string& activeSephirah) {
        OntologicalPrinciple p = getPrinciple(activeSephirah);
        return p.defaultPhysicsInfluence;
    }

}
