// Copyright BANNON.
#include "BannonChainWrestlingManager.h"

void UBannonChainWrestlingManager::StartChainWrestling(AActor* F1, AActor* F2)
{
    bIsChainWrestling = true;
    UE_LOG(LogTemp, Log, TEXT("Starting chain wrestling engagement."));
}
