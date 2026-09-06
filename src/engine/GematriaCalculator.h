#ifndef GEMATRIA_CALCULATOR_H
#define GEMATRIA_CALCULATOR_H

#include <string>

namespace BannonEngine {
    class GematriaCalculator {
    public:
        // Calculates Pythagorean numerology base value (A=1, B=2... Z=26)
        static int calculateBaseValue(const std::string& name);
        // Normalizes the base value into a resonance float (e.g. 0.85 to 1.15) for physics multiplier
        static float calculateResonance(const std::string& name);
    };
}
#endif // GEMATRIA_CALCULATOR_H
