#include "BannonFactionMatrix.h"

void UBannonFactionMatrix::CalculateBetrayalProbability(float AllyGreedStat, float AllyLoyaltyStat, float PlayerMomentum, bool& bWillBetray)
{
    // Tag team partners turning on you because you're getting too popular (high momentum)
    if (PlayerMomentum > 80.0f && AllyGreedStat > 75.0f && AllyLoyaltyStat < 40.0f)
    {
        // Jealousy threshold met. 40% chance to trigger a betrayal cutscene/attack
        bWillBetray = (FMath::RandRange(0, 100) < 40);
    }
    else
    {
        bWillBetray = false;
    }
}

void UBannonFactionMatrix::TriggerBackstageRunIn(const FString& PlayerID, const TMap<FString, float>& RelationshipMatrix, FString& OutRunInCharacterID, bool& bIsFriendly)
{
    // Scans relationship matrix to determine who interrupts a backstage interview or brawl
    float HighestHate = 0.0f;
    float HighestLove = 0.0f;
    FString WorstEnemy = TEXT("");
    FString BestFriend = TEXT("");
    
    for (const TPair<FString, float>& Pair : RelationshipMatrix)
    {
        if (Pair.Value < HighestHate) // Negative values mean hate
        {
            HighestHate = Pair.Value;
            WorstEnemy = Pair.Key;
        }
        else if (Pair.Value > HighestLove) // Positive values mean friendship
        {
            HighestLove = Pair.Value;
            BestFriend = Pair.Key;
        }
    }
    
    // 50/50 chance whether an enemy attacks or a friend comes to hang out/help
    if (FMath::RandRange(0, 100) < 50 && !WorstEnemy.IsEmpty())
    {
        OutRunInCharacterID = WorstEnemy;
        bIsFriendly = false;
    }
    else if (!BestFriend.IsEmpty())
    {
        OutRunInCharacterID = BestFriend;
        bIsFriendly = true;
    }
    else
    {
        OutRunInCharacterID = TEXT("");
        bIsFriendly = true;
    }
}
