#include "GematriaCalculator.h"
#include <cctype>

namespace BannonEngine {
    int GematriaCalculator::calculateBaseValue(const std::string& name) {
        int total = 0;
        for (char c : name) {
            if (std::isalpha(c)) {
                total += (std::toupper(c) - 'A' + 1); // Simple A=1 to Z=26 mapping
            }
        }
        return total;
    }

    float GematriaCalculator::calculateResonance(const std::string& name) {
        int base = calculateBaseValue(name);
        // Baseline 1.0, fluctuate between 0.85 and 1.15 based on esoteric numerical roots
        // Master numbers (11, 22, 33) act as peak nodes.
        float modifier = ((base % 33) / 100.0f);
        return 0.85f + modifier; 
    }
}
