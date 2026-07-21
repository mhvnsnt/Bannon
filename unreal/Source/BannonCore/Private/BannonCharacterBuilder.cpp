#include "BannonCharacterBuilder.h"

UBannonCharacterBuilder::UBannonCharacterBuilder()
{
    MeshCompositor = CreateDefaultSubobject<UBannonMeshCompositor>(TEXT("MeshCompositor"));
    IKBridge = CreateDefaultSubobject<UBannonGrappleIKBridge>(TEXT("IKBridge"));
    MaxHitPoints = 10000.0f;
    VelocityLimit = 3.8f;
    DamageScale = 8.0f;
}

void UBannonCharacterBuilder::ApplyMorphAndSyncPhysics()
{
    if (MeshCompositor && MeshCompositor->PrimaryMesh)
    {
        // 1. Apply all extreme micro-morphing arrays to the skeletal mesh
        for (const auto& Pair : MorphTargets)
        {
            MeshCompositor->PrimaryMesh->SetMorphTarget(Pair.Key, Pair.Value);
        }

        // 2. Sync Jolt physics bounds.
        // Recalculates Poise capacity based on Torso/Neck composite volume
        float CoreWidth = MorphTargets.Contains(TEXT("Core_ScaleX")) ? MorphTargets[TEXT("Core_ScaleX")] : 1.0f;
        float ArmMass = MorphTargets.Contains(TEXT("Arms_ScaleX")) ? MorphTargets[TEXT("Arms_ScaleX")] : 1.0f;
        
        // Dynamically adjust hitboxes in Jolt
        // In real implementation: JoltPhysicsEngine::UpdateBodyScale(this, CoreWidth, ArmMass);
    }
}
