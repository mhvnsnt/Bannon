// Copyright BANNON.
#include "BannonGroundGameManager.h"

void UBannonGroundGameManager::TransitionPosition(AActor* Fighter, EGroundPosition NewPosition)
{
    // Implementation of FSM logic
    UE_LOG(LogTemp, Log, TEXT("Transitioning ground position to %d"), (int32)NewPosition);
    
    // Wire up defensive struggle/offense technical skill matrix here
}
