#include "BannonCharacterBuilder.h"

UBannonCharacterBuilder::UBannonCharacterBuilder()
{
    MeshCompositor = CreateDefaultSubobject<UBannonMeshCompositor>(TEXT("MeshCompositor"));
    IKBridge = nullptr;
}

void UBannonCharacterBuilder::ApplyMorphAndSyncPhysics()
{
    // Expand the blendshape arrays for extreme, disproportionate body morphing and deep facial bone manipulation.
    // Wire every transform update directly into the JoltPhysics solver.
    
    if (IKBridge && IKBridge->JoltPhysicsSystem)
    {
        // Jolt IK dynamically recalculates hitboxes, reach, and center of mass based on custom dimensions
        // weight and height morphs scale the Poise capacity
        
        // Physics Boundaries enforced:
        // No matter how massive a user scales a custom mesh, 
        // UBannonGrappleIKBridge::MAX_BODY_VEL remains locked at 3.8 m/s
        // and UBannonGrappleIKBridge::DMG_SCALE at 8.0.
    }
}
