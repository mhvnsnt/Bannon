#ifndef NEXUS_MESH_FORGE_H
#define NEXUS_MESH_FORGE_H

#include <iostream>
#include <string>

// ============================================================================
// BANNON ENGINE — NEXUS MESH FORGE (PROPRIETARY TRIPO-3D ALTERNATIVE)
// ============================================================================
namespace BannonEngine {

    class NexusMeshForge {
    public:
        NexusMeshForge();
        ~NexusMeshForge();

        // Autonomously generates the high-poly mesh structure from baseline data
        void generateProceduralMesh(const std::string& characterId, bool isNonCanon);

        // Advanced internal rigging loop replacing external tools (Tripo3D)
        void autoRigAndBone(const std::string& characterId);

        // Skinning pass binding the generated bones to the mesh vertices
        void applyDynamicSkinning();
    };

} // namespace BannonEngine

#endif // NEXUS_MESH_FORGE_H
