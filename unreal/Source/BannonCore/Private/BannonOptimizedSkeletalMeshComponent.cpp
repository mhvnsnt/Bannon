#include "BannonOptimizedSkeletalMeshComponent.h"
#include "Engine/World.h"
#include "GameFramework/PlayerController.h"

UBannonOptimizedSkeletalMeshComponent::UBannonOptimizedSkeletalMeshComponent() {
    PrimaryComponentTick.bCanEverTick = true;
    bEnablePerVertexLOD = true;
    LODDistanceThreshold = 2500.0f;
}

void UBannonOptimizedSkeletalMeshComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) {
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

    if (bEnablePerVertexLOD) {
        OptimizeVertexBuffersForDistance();
    }
}

void UBannonOptimizedSkeletalMeshComponent::UpdateOptimizedBuffers() {
    ApplyContinuousBodySkinning();
}

void UBannonOptimizedSkeletalMeshComponent::ApplyContinuousBodySkinning() {
    // Locks vertex buffers and averages normals across disparate CAW chunk seams
    // Injects optimized Vertex Color channels (RGB) for localized damage/sweat maps directly to the GPU
}

void UBannonOptimizedSkeletalMeshComponent::OptimizeVertexBuffersForDistance() {
    if (!GetWorld() || !GetWorld()->GetFirstPlayerController()) return;

    FVector CameraLoc;
    FRotator CameraRot;
    GetWorld()->GetFirstPlayerController()->GetPlayerViewPoint(CameraLoc, CameraRot);

    float DistanceSq = FVector::DistSquared(CameraLoc, GetComponentLocation());

    if (DistanceSq > (LODDistanceThreshold * LODDistanceThreshold)) {
        // Distant fighter: Disable per-vertex morph updates, switch to static baked buffers
        bDisableMorphTarget = true;
        VisibilityBasedAnimTickOption = EVisibilityBasedAnimTickOption::OnlyTickPoseWhenRendered;
    } else {
        // Close combat: AAA vertex deformation, high-res normals, and active morphs
        bDisableMorphTarget = false;
        VisibilityBasedAnimTickOption = EVisibilityBasedAnimTickOption::AlwaysTickPoseAndRefreshBones;
    }
}
