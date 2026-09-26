// Copyright BANNON.
#include "BannonPsychologyParser.h"

void UBannonPsychologyParser::UpdateMomentum(float Delta)
{
    CrowdMomentum = FMath::Clamp(CrowdMomentum + Delta, 0.0f, 100.0f);
    UE_LOG(LogTemp, Log, TEXT("Crowd Momentum Updated: %f"), CrowdMomentum);
}
