#include "BannonClientPrediction.h"

void UBannonClientPrediction::PredictStrikeImpact(float NetworkPingMs, bool bIsStrikeConnectingLocally, bool& bPlayPredictiveHitReaction)
{
    // Masks network latency by playing hit reactions instantly on the client side if ping is high,
    // anticipating the server will confirm the strike a few frames later.
    if (NetworkPingMs > 50.0f && bIsStrikeConnectingLocally)
    {
        bPlayPredictiveHitReaction = true;
    }
    else
    {
        bPlayPredictiveHitReaction = false;
    }
}
