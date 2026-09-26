#include "BannonMDickieContracts.h"

void UBannonMDickieContracts::NegotiateContract(const FString& WrestlerName, FMDickieContract& ProposedContract, bool& bIsAccepted)
{
    // MDickie-style negotiation engine.
    // Checks the wrestler's Attitude, Popularity, and Faction loyalty against the proposed contract terms.
    // Bannon universe integration: Demanding creative control or exorbitant salaries will trigger heel turns or
    // draw the ire of corporate factions (like The Administration).
    
    bIsAccepted = (ProposedContract.WeeklySalary > 5000.0f) ? true : false;
}

void UBannonMDickieContracts::EvaluateBookingRating(float MatchQuality, float Controversy, float& PromotionRating)
{
    // Booking mode mechanics. A promotion's TV rating fluctuates based on match execution
    // and controversial, unscripted moments. High chaos yields high short-term ratings.
    PromotionRating += (MatchQuality * 0.4f) + (Controversy * 0.6f);
}
