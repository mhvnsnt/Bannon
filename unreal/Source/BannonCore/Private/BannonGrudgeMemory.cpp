#include "BannonGrudgeMemory.h"

FBannonMatchTelemetry UBannonGrudgeMemory::ExportTelemetryForPromo()
{
    FBannonMatchTelemetry Telemetry;
    // Gathers exact physical data from the match engine to pass to the Node.js LLM
    // e.g. "I kept you in a crumple state for 4 minutes and fractured your C4 vertebrae."
    Telemetry.TotalTimeInCrumpleState = 240.0f;
    Telemetry.MostDamagedJoint = TEXT("Spine_C4");
    Telemetry.PeakImpactForceReceived = 18000.0f;
    return Telemetry;
}

void UBannonGrudgeMemory::EvaluatePersistentGrudge(const FString& EntityA, const FString& EntityB, float& AggressionMultiplier)
{
    // Rivalries do not end via menu toggles.
    // If a blood feud exists, baseline aggression spikes permanently when they occupy the same ring.
    bool bBloodFeudExists = true; // In reality, queried from the Node.js relationship graph

    if (bBloodFeudExists)
    {
        // Entities will break current targets to attack each other
        AggressionMultiplier = 2.0f;
    }
    else
    {
        AggressionMultiplier = 1.0f;
    }
}
