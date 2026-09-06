#include "BannonBackstagePoliticsMatrix.h"

void UBannonBackstagePoliticsMatrix::RegisterBackstageAltercation(const FString& AttackerID, const FString& VictimID, float DamageDealt, TMap<FString, float>& RivalryMatrix)
{
    // Backstage Politics Matrix: Actions in the sandbox (attacking someone in catering) dynamically shift rivalry graphs.
    FString RivalKey = AttackerID + TEXT("_vs_") + VictimID;
    
    float CurrentRivalry = RivalryMatrix.Contains(RivalKey) ? RivalryMatrix[RivalKey] : 0.0f;
    
    // Increase the rivalry score based on how bad the beatdown was.
    // 100.0f indicates a blood feud.
    float NewRivalry = FMath::Clamp(CurrentRivalry + (DamageDealt * 0.2f), 0.0f, 100.0f);
    
    RivalryMatrix.Add(RivalKey, NewRivalry);
}
