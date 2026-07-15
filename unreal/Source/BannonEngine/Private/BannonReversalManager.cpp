// Copyright BANNON.
#include "BannonReversalManager.h"

void UBannonReversalManager::ExecuteReversal(FName ReversalType)
{
    // Implementation: logic for Breaker, Block, Dodge, MidMove
    if (ReversalType == "Breaker") { UE_LOG(LogTemp, Log, TEXT("Executing Breaker")); }
    else if (ReversalType == "Block") { UE_LOG(LogTemp, Log, TEXT("Executing Block")); }
    else if (ReversalType == "Dodge") { UE_LOG(LogTemp, Log, TEXT("Executing Dodge")); }
    else if (ReversalType == "MidMove") { UE_LOG(LogTemp, Log, TEXT("Executing MidMove")); }
}
