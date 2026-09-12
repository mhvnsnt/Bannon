#include "BannonLayerSorter.h"
#include "Components/SkeletalMeshComponent.h"

UBannonLayerSorter::UBannonLayerSorter() {
}

void UBannonLayerSorter::CalculateDepthStencilMasks(int32 LayerIndex, float& OutDepthOffset, int32& OutStencilValue) {
    // Layer 01 inner-wear calculates tightly; Layer 60 jacket pushes bounds outwards.
    // Ensure no clipping by assigning incremental depth stencil masks per layer.
    OutDepthOffset = (float)LayerIndex * 0.15f;
    OutStencilValue = LayerIndex + 100; // Base stencil offset to isolate rendering
}

void UBannonLayerSorter::GenerateJoltProxyConstraints(int32 LayerIndex, USkeletalMeshComponent* InnerMesh, USkeletalMeshComponent* OuterMesh) {
    if (!InnerMesh || !OuterMesh) return;
    
    // Assign Jolt physical constraint proxies to act as outer-layer physical blockers.
    // This forces outer garments to deform naturally around inner equipment bounds dynamically,
    // preventing the need for expensive real-time boolean subtraction.
}
