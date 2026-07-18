#include "BannonAITauntBaiting.h"

UBannonAITauntBaiting::UBannonAITauntBaiting()
{
    PrimaryComponentTick.bCanEverTick = true;
    SafetyMargin = 350.0f; // 3.5 meters
}

void UBannonAITauntBaiting::BeginPlay()
{
    Super::BeginPlay();
}

bool UBannonAITauntBaiting::ShouldBaitOpponent(AActor* Target, float DistanceToTarget)
{
    if (DistanceToTarget > SafetyMargin)
    {
        UE_LOG(LogTemp, Log, TEXT("Bannon AI: Target is %f units away. Safe to taunt!"), DistanceToTarget);
        return true;
    }
    
    return false;
}

void UBannonAITauntBaiting::ExecuteMomentumTaunt()
{
    UE_LOG(LogTemp, Log, TEXT("Bannon AI: Executing momentum-building taunt. Monitoring opponent for rash attacks."));
    // Trigger animation, increase momentum pool slowly over time
}
