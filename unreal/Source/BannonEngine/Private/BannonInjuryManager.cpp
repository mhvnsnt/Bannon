// Copyright BANNON.
#include "BannonInjuryManager.h"

void UBannonInjuryManager::RegisterInjury(AActor* Fighter, FName BodyPart, float Severity)
{
    UE_LOG(LogTemp, Log, TEXT("Registering injury to %s with severity %f"), *BodyPart.ToString(), Severity);
}
