#include "BannonSubmissionBranching.h"

void UBannonSubmissionBranching::EvaluateSubmissionTransition(float AttackerStamina, float DefenderResistance, FString& CurrentHold, FString& OutNextHold)
{
    // MDickie style seamless chain wrestling / submission branching
    // If attacker has high stamina and defender is resisting heavily, the attacker might transition to a more secure hold
    if (AttackerStamina > 50.0f && DefenderResistance > 70.0f)
    {
        if (CurrentHold == TEXT("SleeperHold"))
        {
            OutNextHold = TEXT("DragonSleeper"); // Upgrade to a more lethal hold
        }
        else if (CurrentHold == TEXT("Armbar"))
        {
            OutNextHold = TEXT("TriangleChoke");
        }
        else
        {
            OutNextHold = CurrentHold;
        }
    }
    else
    {
        OutNextHold = CurrentHold; // Maintain current hold
    }
}
