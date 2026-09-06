#include "BannonCrowdInstancer.h"

UBannonCrowdInstancer::UBannonCrowdInstancer() {
    PrimaryComponentTick.bCanEverTick = false;
    // Pre-allocate Custom Primitive Data slots for the Material Shader
    // Index 0: Intensity multiplier for World Position Offset (WPO) jumping/jittering
    NumCustomDataFloats = 1; 
}

void UBannonCrowdInstancer::PopulateArenaBlock(const TArray<FTransform>& SeatTransforms) {
    if (SeatTransforms.Num() == 0) return;
    
    // Batch spawn thousands of crowd instances natively in a single draw call
    AddInstances(SeatTransforms, false);
}

void UBannonCrowdInstancer::UpdateCrowdShaderIntensity(float CurrentIntensity) {
    // Push Poise-driven intensity natively to the HISM Custom Primitive Data.
    // The GPU Vulkan shader ingests this float to drive vertex offset jumping.
    // Eradicates standard skeletal meshes for the crowd, preventing ARM64 GPU blowouts.
    SetCustomPrimitiveDataFloat(0, CurrentIntensity);
}
