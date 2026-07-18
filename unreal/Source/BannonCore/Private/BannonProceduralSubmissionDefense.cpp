#include "BannonProceduralSubmissionDefense.h"

void UBannonProceduralSubmissionDefense::EvaluateEscapeStrategy(const FVector& DefenderLocation, const TArray<FVector>& RopeSplinePoints, float CurrentStamina, float EscapeDifficulty, FString& OutChosenStrategy, FVector& OutCrawlTarget)
{
    // Deep AI logic for escaping submissions. CPU dynamically analyzes positional geometry vs internal stamina resources.
    float NearestRopeDist = MAX_FLT;
    FVector BestTarget = FVector::ZeroVector;

    // 1. Calculate nearest spatial geometry (rope breaks)
    for (const FVector& RopeNode : RopeSplinePoints)
    {
        float Dist = FVector::Dist(DefenderLocation, RopeNode);
        if (Dist < NearestRopeDist)
        {
            NearestRopeDist = Dist;
            BestTarget = RopeNode;
        }
    }

    OutCrawlTarget = BestTarget;

    // 2. Evaluate Stamina vs Geometry
    // If the rope is very close (within 2 meters), always prioritize crawling.
    // If stamina is critical (< 25%), breaking the grip via brute force is impossible, must crawl out of desperation.
    if (NearestRopeDist < 200.0f || CurrentStamina < 25.0f)
    {
        OutChosenStrategy = TEXT("CrawlToRopes");
    }
    // If stamina is high and the hold isn't overwhelmingly difficult, use brute force to shatter the grip.
    else if (CurrentStamina > (EscapeDifficulty * 1.5f))
    {
        OutChosenStrategy = TEXT("BreakGrip");
    }
    else
    {
        // Fallback: If far from ropes and low stamina, panic/thrash to try and force a scramble.
        OutChosenStrategy = TEXT("DesperationThrash");
    }
}
