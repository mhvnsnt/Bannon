#include "BannonLimbRagdoll.h"

UBannonLimbRagdoll::UBannonLimbRagdoll()
{
    PrimaryComponentTick.bCanEverTick = true;
    bIsLimbLimp = false;
}

void UBannonLimbRagdoll::BeginPlay()
{
    Super::BeginPlay();
}

void UBannonLimbRagdoll::TriggerLimpState(FName BoneName, float Duration)
{
    ActiveLimpBone = BoneName;
    bIsLimbLimp = true;
    
    // Set bone physics to simulated while keeping the rest kinematic/animated
    UE_LOG(LogTemp, Log, TEXT("Bannon Physics: Triggered Limb-Specific Ragdoll on %s"), *BoneName.ToString());
    
    // TODO: Start timer to recover from dead leg/arm based on Duration
}

void UBannonLimbRagdoll::UpdateBalanceCompensation()
{
    if (bIsLimbLimp)
    {
        // Shift IK targets and center of mass to compensate for the limp limb
        UE_LOG(LogTemp, Log, TEXT("Bannon Physics: Compensating balance for limp limb: %s"), *ActiveLimpBone.ToString());
    }
}
