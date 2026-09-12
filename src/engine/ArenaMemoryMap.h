#ifndef ARENA_MEMORY_MAP_H
#define ARENA_MEMORY_MAP_H

#include <string>

// ============================================================================
// BANNON ENGINE — NATIVE C++ ARENA STRUCTURAL BLOCK HEADER
// ============================================================================

namespace BannonEngine {

struct Vec3 {
    float x, y, z;
};

// High-performance binary block representing ring geometry, ropes, or barricades
struct ArenaStructuralBlock {
    unsigned int blockID;
    unsigned int vertexCount;
    float structuralIntegrityThreshold; // Poise resistance for environmental geometry
    bool isFragmented;
    Vec3 originOffset;
    // Followed by raw vertex and physics collider data...
};

class ArenaMemoryMap {
public:
    ArenaMemoryMap(const std::string& filepath);
    ~ArenaMemoryMap();

    bool mapCluster();
    void unmap();
    
    ArenaStructuralBlock* getBlock(size_t offset);
    void applyKineticShockwave(size_t blockOffset, float force, const Vec3& origin);

private:
    std::string filePath;
    int fd;
    void* mappedData;
    size_t fileSize;
};

} // namespace BannonEngine

#endif // ARENA_MEMORY_MAP_H
