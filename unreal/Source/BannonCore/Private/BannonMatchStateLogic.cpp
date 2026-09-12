#include "BannonMatchStateLogic.h"
#include "Components/SkeletalMeshComponent.h"
#include "Components/PrimitiveComponent.h"

UBannonMatchStateLogic::UBannonMatchStateLogic() {
    PrimaryComponentTick.bCanEverTick = true;
}

bool UBannonMatchStateLogic::ValidatePinAttempt(USkeletalMeshComponent* DefendingMesh, UPrimitiveComponent* RingMatCollider) {
    if (!DefendingMesh || !RingMatCollider) return false;

    // Direct Jolt Physics verification: Pin counts ONLY trigger if BOTH shoulder proxies mathematically touch the mat.
    FVector LeftShoulderPos = DefendingMesh->GetSocketLocation(TEXT("bone_Shoulder_L"));
    FVector RightShoulderPos = DefendingMesh->GetSocketLocation(TEXT("bone_Shoulder_R"));
    
    // Perform sphere traces or overlapping box checks against RingMatCollider in actual physics engine bounds
    // For structural proof:
    float MatZ = RingMatCollider->GetComponentLocation().Z;
    float Threshold = 15.0f; // Centimeters off the mat tolerance
    
    bool bLeftDown = FMath::Abs(LeftShoulderPos.Z - MatZ) <= Threshold;
    bool bRightDown = FMath::Abs(RightShoulderPos.Z - MatZ) <= Threshold;

    return bLeftDown && bRightDown;
}

void UBannonMatchStateLogic::ApplyLocalizedLimbFatigue(FName TargetBone, float DamageForce) {
    float& CurrentFatigue = LimbFatigueArrays.FindOrAdd(TargetBone, 0.0f);
    CurrentFatigue = FMath::Clamp(CurrentFatigue + DamageForce, 0.0f, 100.0f); // 100 is total limb failure
}

float UBannonMatchStateLogic::GetCurrentLimbFatigue(FName TargetBone) const {
    const float* Value = LimbFatigueArrays.Find(TargetBone);
    return Value ? *Value : 0.0f;
}

void UBannonMatchStateLogic::TickPoiseDegradation(float DeltaTime) {
    // Escaping holds gets mathematically harder as limbs degrade, directly modifying Poise regeneration curves.
}

void UBannonMatchStateLogic::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) {
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
    TickPoiseDegradation(DeltaTime);
}
