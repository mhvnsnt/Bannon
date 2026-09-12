#include "BannonPersistentScars.h"

void UBannonPersistentScars::ApplyLacerationToRecord(const FString& WrestlerID, const FString& BodyPart, float LacerationSeverity, TMap<FString, float>& InOutScarData)
{
    // MDickie-style persistent visual changes: bleeding creates permanent scars over time.
    if (LacerationSeverity > 50.0f)
    {
        FString Key = WrestlerID + TEXT("_") + BodyPart;
        float CurrentSeverity = InOutScarData.Contains(Key) ? InOutScarData[Key] : 0.0f;
        
        // Add to persistent scar severity, capped at 100
        InOutScarData.Add(Key, FMath::Min(100.0f, CurrentSeverity + (LacerationSeverity * 0.2f)));
    }
}

void UBannonPersistentScars::CalculateMorphTargetIntensity(float TotalScarSeverity, float& OutMorphTargetWeight)
{
    // Translates saved severity data into a 0.0 - 1.0 weight for MetaHuman facial/body morph targets
    OutMorphTargetWeight = FMath::Clamp(TotalScarSeverity / 100.0f, 0.0f, 1.0f);
}
