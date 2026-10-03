#include "BannonPromoBattleEngine.h"

void UBannonPromoBattleEngine::EvaluatePromoKeywords(const FString& Dialogue, float PerformerCharisma, float& OutMomentumBuff, float& OutCrowdHeatShift)
{
    OutMomentumBuff = 0.0f;
    OutCrowdHeatShift = 0.0f;

    FString LowerDialogue = Dialogue.ToLower();
    
    if (LowerDialogue.Contains(TEXT("pathetic")) || LowerDialogue.Contains(TEXT("destroy")) || LowerDialogue.Contains(TEXT("garbage")))
    {
        OutCrowdHeatShift -= (10.0f * (PerformerCharisma / 100.0f)); // Heel Heat
        OutMomentumBuff += 15.0f; 
    }
    
    if (LowerDialogue.Contains(TEXT("fans")) || LowerDialogue.Contains(TEXT("champion")) || LowerDialogue.Contains(TEXT("honor")))
    {
        OutCrowdHeatShift += (15.0f * (PerformerCharisma / 100.0f)); // Face Pop
        OutMomentumBuff += 10.0f;
    }
    
    if (LowerDialogue.Contains(TEXT("nigga")) || LowerDialogue.Contains(TEXT("shoot")))
    {
        // Street slang / shoot terms break the fourth wall and get maximum heat
        OutCrowdHeatShift += (20.0f * (PerformerCharisma / 100.0f));
        OutMomentumBuff += 25.0f;
    }
}
