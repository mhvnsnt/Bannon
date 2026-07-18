#include "BannonCrowdHeatMemory.h"

void UBannonCrowdHeatMemory::RegisterBetrayalOrHeroic(const FString& WrestlerID, const FString& TargetID, bool bIsBetrayal, TMap<FString, float>& GlobalHeatMatrix)
{
    // Universe mode memory for the audience, tracking heel/face heat globally across events.
    float CurrentHeat = GlobalHeatMatrix.Contains(WrestlerID) ? GlobalHeatMatrix[WrestlerID] : 0.0f;

    if (bIsBetrayal)
    {
        // Betraying a tag partner or attacking someone from behind generates massive Heel heat (Negative)
        CurrentHeat -= 40.0f;
    }
    else
    {
        // Saving a rival from a beatdown generates massive Face heat (Positive)
        CurrentHeat += 40.0f;
    }

    // Clamp between -100 (Nuclear Heat) and +100 (White Hot Babyface)
    GlobalHeatMatrix.Add(WrestlerID, FMath::Clamp(CurrentHeat, -100.0f, 100.0f));
}

void UBannonCrowdHeatMemory::CalculateEntranceReaction(const FString& WrestlerID, const TMap<FString, float>& GlobalHeatMatrix, float& OutCrowdVolume, FString& OutReactionType)
{
    float Heat = GlobalHeatMatrix.Contains(WrestlerID) ? GlobalHeatMatrix[WrestlerID] : 0.0f;
    OutCrowdVolume = FMath::Abs(Heat) / 100.0f; // More absolute heat = louder crowd

    if (Heat < -30.0f)
    {
        OutReactionType = TEXT("Booing");
    }
    else if (Heat > 30.0f)
    {
        OutReactionType = TEXT("Cheering");
    }
    else
    {
        OutReactionType = TEXT("Apathetic");
        OutCrowdVolume = 0.2f; // Baseline murmur
    }
}
