#ifndef EVOLUTION_MATRIX_H
#define EVOLUTION_MATRIX_H

#include <string>
#include <map>
#include <vector>

// ============================================================================
// BANNON ENGINE — NATIVE C++ PERSISTENT EVOLUTION MATRIX
// ============================================================================

namespace BannonEngine {

    struct CharacterMemoryBlock {
        char uuid[64];
        int totalMatches;
        int totalWins;
        int peakMomentumState; // e.g. how high their resonance gauge has ever gotten
        float evolutionaryAdaptation; // Multiplier that permanently grows
        float karmicAlignment; // Shifts between -1.0 (Dark/Heel) and 1.0 (Light/Face)
    };

    class EvolutionMatrix {
    public:
        EvolutionMatrix(const std::string& dbPath);
        ~EvolutionMatrix();

        // Maps a permanent binary file on disk to maintain memory between sessions
        bool initializeMemoryMatrix();
        
        // Updates the ontological memory of a character post-match
        void evolveCharacter(const std::string& uuid, bool wonMatch, float resonanceHit, float karmicShift);
        
        // Fetches a character's current permanent memory state
        CharacterMemoryBlock getCharacterMemory(const std::string& uuid);

    private:
        std::string databasePath;
        int fd;
        void* mappedMemory;
        size_t matrixSize;

        std::map<std::string, CharacterMemoryBlock*> memoryMap;
        void mapExistingBlocks();
    };

} // namespace BannonEngine

#endif // EVOLUTION_MATRIX_H
