#include "BannonPromoBattleMechanics.h"

void UBannonPromoBattleMechanics::EvaluatePromoKeywords(const FString& LLMGeneratedDialogue, float CharismaStat, float& OutMomentumBuff, float& OutCrowdHeatShift)
{
    // Promo Battle Dialogue System: Real-time LLM-generated promo battles where keywords trigger momentum buffs.
    OutMomentumBuff = 0.0f;
    OutCrowdHeatShift = 0.0f;

    FString LowerDialogue = LLMGeneratedDialogue.ToLower();
    
    // Evaluate Heel (Aggressive/Insulting) Keywords
    if (LowerDialogue.Contains(TEXT("pathetic")) || LowerDialogue.Contains(TEXT("destroy")) || LowerDialogue.Contains(TEXT("garbage")))
    {
        OutCrowdHeatShift -= (10.0f * (CharismaStat / 100.0f)); // Generates Heel Heat (Negative)
        OutMomentumBuff += 15.0f; // Aggressive promos give a strong starting momentum buff
    }
    
    // Evaluate Babyface (Heroic/Pandering) Keywords
    if (LowerDialogue.Contains(TEXT("fans")) || LowerDialogue.Contains(TEXT("champion")) || LowerDialogue.Contains(TEXT("promise")))
    {
        OutCrowdHeatShift += (15.0f * (CharismaStat / 100.0f)); // Generates Babyface Cheer (Positive)
        OutMomentumBuff += 10.0f;
    }
}
