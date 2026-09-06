#include "ArenaMemoryMap.h"
#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <iostream>
#include <cstring>

// ============================================================================
// BANNON ENGINE — NATIVE C++ ARENA MEMORY MAP (BRICK 146)
// ============================================================================

namespace BannonEngine {

ArenaMemoryMap::ArenaMemoryMap(const std::string& filepath) : filePath(filepath), fd(-1), mappedData(nullptr), fileSize(0) {}

ArenaMemoryMap::~ArenaMemoryMap() {
    unmap();
}

bool ArenaMemoryMap::mapCluster() {
    fd = open(filePath.c_str(), O_RDWR | O_CREAT, 0666);
    if (fd == -1) {
        std::cerr << "[NEXUS ERROR] Failed to open arena cluster file." << std::endl;
        return false;
    }

    struct stat sb;
    if (fstat(fd, &sb) == -1) {
        std::cerr << "[NEXUS ERROR] Failed to stat arena cluster file." << std::endl;
        close(fd);
        return false;
    }

    fileSize = sb.st_size;
    if (fileSize == 0) {
        // Initialize empty structural cluster block (100MB)
        fileSize = 100 * 1024 * 1024;
        if (ftruncate(fd, fileSize) == -1) {
            std::cerr << "[NEXUS ERROR] Failed to truncate arena cluster file." << std::endl;
            close(fd);
            return false;
        }
    }

    mappedData = mmap(nullptr, fileSize, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    if (mappedData == MAP_FAILED) {
        std::cerr << "[NEXUS ERROR] Memory mapping failed." << std::endl;
        close(fd);
        return false;
    }

    std::cout << "[NEXUS] Arena structural clusters mapped to high-performance binary blocks. Size: " << fileSize << " bytes." << std::endl;
    return true;
}

void ArenaMemoryMap::unmap() {
    if (mappedData != MAP_FAILED && mappedData != nullptr) {
        munmap(mappedData, fileSize);
        mappedData = nullptr;
    }
    if (fd != -1) {
        close(fd);
        fd = -1;
    }
}

ArenaStructuralBlock* ArenaMemoryMap::getBlock(size_t offset) {
    if (mappedData == MAP_FAILED || offset >= fileSize) return nullptr;
    return reinterpret_cast<ArenaStructuralBlock*>(static_cast<char*>(mappedData) + offset);
}

void ArenaMemoryMap::applyKineticShockwave(size_t blockOffset, float force, const Vec3& origin) {
    ArenaStructuralBlock* block = getBlock(blockOffset);
    if (block) {
        // Procedural mesh splitting threshold check
        if (force > block->structuralIntegrityThreshold) {
            block->isFragmented = true;
            std::cout << "[NEXUS PHYSICS] BARRICADE FRAGMENTATION TRIGGERED at offset " << blockOffset << std::endl;
            // Native C++ logic triggers localized debris physics bodies here
        }
    }
}

} // namespace BannonEngine
