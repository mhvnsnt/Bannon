#include "BannonMatchStateComponent.h"

UBannonMatchStateComponent::UBannonMatchStateComponent()
{
    PrimaryComponentTick.bCanEverTick = true;
    CurrentRefereeCount = 0.0f;
}

void UBannonMatchStateComponent::BeginPlay()
{
    Super::BeginPlay();
}

void UBannonMatchStateComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
}

void UBannonMatchStateComponent::InitiateRefereeCount(float DeltaTime)
{
    CurrentRefereeCount += DeltaTime * COUNT_SPEED;
    
    if (CurrentRefereeCount >= MAX_COUNT)
    {
        UE_LOG(LogTemp, Log, TEXT("[BannonMatchStateComponent] MATCH CONCLUDED: Pinfall Successful."));
    }
}

void UBannonMatchStateComponent::ResetRefereeCount()
{
    CurrentRefereeCount = 0.0f;
    UE_LOG(LogTemp, Log, TEXT("[BannonMatchStateComponent] Pinfall broken. Count reset."));
}

bool UBannonMatchStateComponent::ValidateRingBoundaries(FVector Location)
{
    // Validate whether action is inside legal boundaries
    return true; 
}
