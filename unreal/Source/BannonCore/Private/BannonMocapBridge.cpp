#include "BannonMocapBridge.h"

UBannonMocapBridge::UBannonMocapBridge() {
    PrimaryComponentTick.bCanEverTick = false;
}

FVector UBannonMocapBridge::ExtractAndClampRootMotion(FVector RawRootDelta, float DeltaTime) {
    // Intercept movement deltas before capsule execution
    if (DeltaTime <= 0.0f) return FVector::ZeroVector;
    
    float CurrentVelocity = RawRootDelta.Size() / DeltaTime;
    float MaxVelocity = 3.8f * 100.0f; // MAX_BODY_VEL (3.8 m/s) converted to cm/s
    
    if (CurrentVelocity > MaxVelocity) {
        RawRootDelta = RawRootDelta.GetSafeNormal() * (MaxVelocity * DeltaTime);
    }
    
    // Feed exact positional data into Jolt to prevent sliding
    return RawRootDelta;
}
