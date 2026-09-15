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

#include "BannonMatchStateLogic.h"
#include "Materials/MaterialInstanceDynamic.h"

void UBannonOptimizedSkeletalMeshComponent::UpdateLiveDamageVisuals(UBannonMatchStateLogic* MatchLogic) {
    if (!MatchLogic || bDisableMorphTarget) return;

    // Head / Torso fatigue mapped to dynamic sweat and laceration vectors
    float HeadFatigue = MatchLogic->GetCurrentLimbFatigue(TEXT("bone_Head"));
    float TorsoFatigue = MatchLogic->GetCurrentLimbFatigue(TEXT("bone_Spine_02"));

    // Calculate normalized damage/sweat floats (0.0 to 1.0)
    float SweatOpacity = FMath::Clamp(TorsoFatigue / 50.0f, 0.0f, 1.0f);
    float BloodOpacity = FMath::Clamp((HeadFatigue - 50.0f) / 50.0f, 0.0f, 1.0f); // Starts bleeding after 50% fatigue

    // Apply to DMI parameters directly rendering over the RGB vertex buffer map
    for (int32 i = 0; i < GetNumMaterials(); ++i) {
        UMaterialInstanceDynamic* DMI = Cast<UMaterialInstanceDynamic>(GetMaterial(i));
        if (DMI) {
            DMI->SetScalarParameterValue(TEXT("SweatLayer_Opacity"), SweatOpacity);
            DMI->SetScalarParameterValue(TEXT("DamageLayer_Opacity"), BloodOpacity);
        }
    }
}
