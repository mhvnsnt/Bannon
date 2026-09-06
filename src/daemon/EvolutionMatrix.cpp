#include "EvolutionMatrix.h"
#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <iostream>
#include <cstring>
#include <algorithm>

namespace BannonEngine {

    EvolutionMatrix::EvolutionMatrix(const std::string& dbPath) : databasePath(dbPath), fd(-1), mappedMemory(nullptr), matrixSize(1024 * 1024 * 10) {} // 10MB memory pool

    EvolutionMatrix::~EvolutionMatrix() {
        if (mappedMemory != MAP_FAILED && mappedMemory != nullptr) {
            munmap(mappedMemory, matrixSize);
        }
        if (fd != -1) close(fd);
    }

    bool EvolutionMatrix::initializeMemoryMatrix() {
        fd = open(databasePath.c_str(), O_RDWR | O_CREAT, 0666);
        if (fd == -1) {
            std::cerr << "[NEXUS DAEMON] ERROR: Failed to open Evolution Matrix database." << std::endl;
            return false;
        }

        struct stat sb;
        fstat(fd, &sb);
        if (sb.st_size == 0) {
            if (ftruncate(fd, matrixSize) == -1) return false;
        } else {
            matrixSize = sb.st_size;
        }

        mappedMemory = mmap(nullptr, matrixSize, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
        if (mappedMemory == MAP_FAILED) return false;

        std::cout << "[NEXUS DAEMON] Evolution Matrix online. Persistent memory mapping activated." << std::endl;
        return true;
    }

    void EvolutionMatrix::evolveCharacter(const std::string& uuid, bool wonMatch, float resonanceHit, float karmicShift) {
        if (mappedMemory == MAP_FAILED) return;

        // Simple mock mapping for the block
        // In production, this uses a robust block allocation table
        CharacterMemoryBlock* block = reinterpret_cast<CharacterMemoryBlock*>(mappedMemory);
        
        bool found = false;
        for (size_t i = 0; i < 100; i++) {
            if (std::strcmp(block[i].uuid, uuid.c_str()) == 0) {
                block = &block[i];
                found = true;
                break;
            } else if (std::strlen(block[i].uuid) == 0) {
                // Empty slot, register new character
                std::strncpy(block[i].uuid, uuid.c_str(), 63);
                block[i].totalMatches = 0;
                block[i].totalWins = 0;
                block[i].peakMomentumState = 0;
                block[i].evolutionaryAdaptation = 1.0f;
                block[i].karmicAlignment = 0.0f;
                block = &block[i];
                found = true;
                break;
            }
        }

        if (found) {
            block->totalMatches++;
            if (wonMatch) {
                block->totalWins++;
                block->evolutionaryAdaptation += 0.01f; // Slow, permanent growth
            } else {
                block->evolutionaryAdaptation = std::max(1.0f, block->evolutionaryAdaptation - 0.005f);
            }

            if (resonanceHit > block->peakMomentumState) {
                block->peakMomentumState = resonanceHit;
            }

            block->karmicAlignment = std::clamp(block->karmicAlignment + karmicShift, -1.0f, 1.0f);

            std::cout << "[NEXUS DAEMON] Character " << uuid << " evolved. New Adaptation: " 
                      << block->evolutionaryAdaptation << " | Karma: " << block->karmicAlignment << std::endl;
        }
    }

    CharacterMemoryBlock EvolutionMatrix::getCharacterMemory(const std::string& uuid) {
        if (mappedMemory != MAP_FAILED) {
            CharacterMemoryBlock* block = reinterpret_cast<CharacterMemoryBlock*>(mappedMemory);
            for (size_t i = 0; i < 100; i++) {
                if (std::strcmp(block[i].uuid, uuid.c_str()) == 0) {
                    return block[i];
                }
            }
        }
        CharacterMemoryBlock emptyBlock{};
        return emptyBlock;
    }

} // namespace BannonEngine
