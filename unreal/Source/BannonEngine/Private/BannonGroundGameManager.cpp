// Copyright BANNON.
#include "BannonGroundGameManager.h"

void UBannonGroundGameManager::TransitionPosition(AActor* Fighter, EGroundPosition NewPosition)
{
    // FSM Logic for Ground Transitions
    UE_LOG(LogTemp, Log, TEXT("Ground FSM Transitioning to: %d"), (int32)NewPosition);
    
    // Wire up input-based struggle versus skill matrix logic here
}
