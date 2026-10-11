#include "BannonCrowdHeatMemory.h"

UBannonCrowdHeatMemory::UBannonCrowdHeatMemory()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonCrowdHeatMemory::BeginPlay()
{
    Super::BeginPlay();
}

void UBannonCrowdHeatMemory::RecordHeatEvent(FName EventType, float Magnitude)
{
    // Accumulate heat in the historical matrix
    if (HistoricalHeatMatrix.Contains(EventType))
    {
        HistoricalHeatMatrix[EventType] += Magnitude;
    }
    else
    {
        HistoricalHeatMatrix.Add(EventType, Magnitude);
    }
    
    UE_LOG(LogTemp, Log, TEXT("Bannon Crowd: Heat event [%s] recorded. Magnitude: %f"), *EventType.ToString(), Magnitude);
}

float UBannonCrowdHeatMemory::CalculateBaselineHeat(FName FighterID, FName ArenaID)
{
    // Math to determine starting heat for a match based on previous acts
    float TotalHeat = 0.0f;
    for (const auto& Pair : HistoricalHeatMatrix)
    {
        TotalHeat += Pair.Value;
    }
    
    UE_LOG(LogTemp, Log, TEXT("Bannon Crowd: Baseline heat for %s at %s calculated as %f"), *FighterID.ToString(), *ArenaID.ToString(), TotalHeat);
    return FMath::Clamp(TotalHeat, -100.0f, 100.0f);
}
