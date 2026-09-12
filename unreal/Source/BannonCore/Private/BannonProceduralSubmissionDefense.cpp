#include "BannonProceduralSubmissionDefense.h"

void UBannonProceduralSubmissionDefense::EvaluateEscapeStrategy(float CurrentStamina, float DistanceToRopes, float HoldPressure, bool& bCrawlToRopes, bool& bBruteForceEscape)
{
    // Procedural Submission Defense: AI dynamically chooses between breaking the grip via brute force 
    // or crawling toward the nearest ring rope based on positional geometry and current stamina levels.
    
    bCrawlToRopes = false;
    bBruteForceEscape = false;

    // If stamina is high and the hold isn't completely locked in, try to brute force out
    if (CurrentStamina > 40.0f && HoldPressure < 80.0f)
    {
        bBruteForceEscape = true;
    }
    // If we are relatively close to the ropes (e.g. within 300 units), favor the rope break
    else if (DistanceToRopes < 300.0f)
    {
        bCrawlToRopes = true;
    }
    // Desperation: If stamina is low and ropes are far, they will still try to crawl but slowly
    else if (CurrentStamina < 20.0f)
    {
        bCrawlToRopes = true;
    }
    else
    {
        // Default to attempting to power out if not near ropes, but success chance will be lower
        bBruteForceEscape = true;
    }
}
