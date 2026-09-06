#include "BannonLLMContractExpansion.h"

void UBannonLLMContractExpansion::ParseContractCounterOffer(const FString& LLMResponseJSON, float StarPower, bool& bDemandsCreativeControl, float& OutMerchCut, float& OutAdvanceFee, bool& bWalksOut)
{
    // Expands the LLM negotiation system to parse specific MDickie legacy contract clauses.
    // In full implementation, JSON parsing would extract these values. We stub the logic based on StarPower.
    
    if (StarPower > 85.0f)
    {
        bDemandsCreativeControl = true; // Top stars demand creative control
        OutMerchCut = 50.0f; // Demands 50% of merchandise sales
        OutAdvanceFee = StarPower * 1000.0f;
        bWalksOut = false;
    }
    else
    {
        bDemandsCreativeControl = false;
        OutMerchCut = 10.0f;
        OutAdvanceFee = 0.0f;
        
        // If low star power but aggressive LLM generation (simulated here by extreme conditions), they might walk out
        bWalksOut = (LLMResponseJSON.Contains(TEXT("insulting")) || LLMResponseJSON.Contains(TEXT("walk out")));
    }
}

void UBannonLLMContractExpansion::EvaluateCreativeControlBreach(bool bHasCreativeControl, bool bBookedToLose, bool& bRefusesToWrestle, FString& OutLLMComplainPrompt)
{
    // Classic MDickie scenario: A wrestler with Creative Control refuses to do the job (lose).
    if (bHasCreativeControl && bBookedToLose)
    {
        bRefusesToWrestle = true;
        OutLLMComplainPrompt = TEXT("You are a wrestling star with Creative Control. The booker just told you to lose tonight. Generate an angry refusal rant.");
    }
    else
    {
        bRefusesToWrestle = false;
        OutLLMComplainPrompt = TEXT("");
    }
}
