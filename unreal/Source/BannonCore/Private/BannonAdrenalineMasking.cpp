#include "BannonAdrenalineMasking.h"

UBannonAdrenalineMasking::UBannonAdrenalineMasking()
{
    PrimaryComponentTick.bCanEverTick = true;
    bIsAdrenalineActive = false;
}

void UBannonAdrenalineMasking::BeginPlay()
{
    Super::BeginPlay();
}

void UBannonAdrenalineMasking::EvaluateAdrenalineRush(float CurrentMomentum, float Threshold)
{
    if (CurrentMomentum >= Threshold && !bIsAdrenalineActive)
    {
        bIsAdrenalineActive = true;
        UE_LOG(LogTemp, Warning, TEXT("Bannon Medical: ADRENALINE RUSH! Fighter is hulking up, ignoring limb penalties."));
    }
    else if (CurrentMomentum < Threshold && bIsAdrenalineActive)
    {
        bIsAdrenalineActive = false;
        UE_LOG(LogTemp, Warning, TEXT("Bannon Medical: Adrenaline fade. Injuries return to full effect."));
    }
}

bool UBannonAdrenalineMasking::IsLimpingMasked() const
{
    return bIsAdrenalineActive;
}
