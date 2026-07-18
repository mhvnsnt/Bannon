#include "BannonNeuralNetworkAI.h"

void UBannonNeuralNetworkAI::RegisterPlayerTendency(const FString& ActionType, TMap<FString, int32>& ActionFrequencyLedger)
{
    // Deep simulation CPU AI that learns player tendencies.
    // If a player spams the same move (e.g., "RunningStrike" or "Grapple"), the AI remembers.
    int32 CurrentCount = ActionFrequencyLedger.Contains(ActionType) ? ActionFrequencyLedger[ActionType] : 0;
    ActionFrequencyLedger.Add(ActionType, CurrentCount + 1);
}

void UBannonNeuralNetworkAI::CalculateAdaptiveReversalTiming(const TMap<FString, int32>& ActionFrequencyLedger, const FString& IncomingAction, float BaseReversalChance, float& OutAdaptedReversalChance)
{
    // If the player uses a predictable pattern, the AI drastically increases its reversal window/chance.
    int32 TimesUsed = ActionFrequencyLedger.Contains(IncomingAction) ? ActionFrequencyLedger[IncomingAction] : 0;

    // For every time the player has used this specific attack, the AI becomes 5% more likely to reverse it.
    float AdaptationBonus = TimesUsed * 5.0f; 
    
    OutAdaptedReversalChance = FMath::Clamp(BaseReversalChance + AdaptationBonus, 0.0f, 95.0f); // Max 95% chance to allow rare hits
}
