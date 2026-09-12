#include "BannonAINeuralAdaptation.h"

void UBannonAINeuralAdaptation::EvaluatePlayerTendency(int32 ReversalAttempts, int32 SuccessfulReversals, float& OutAIFeintProbability)
{
    // Brawler AI Neural Network stub: AI learns player tendencies.
    // If the player spams the reversal button (many attempts, low success rate), the AI adapts by feinting more often to bait the animation lock.
    if (ReversalAttempts > 5)
    {
        float SpamRatio = 1.0f - ((float)SuccessfulReversals / (float)ReversalAttempts);
        OutAIFeintProbability = SpamRatio * 100.0f; // High spam ratio = high chance AI will feint
    }
    else
    {
        OutAIFeintProbability = 10.0f; // Default baseline feint rate
    }
}
