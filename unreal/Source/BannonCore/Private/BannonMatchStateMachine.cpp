#include "BannonMatchStateMachine.h"
#include "Engine/Engine.h"

ABannonMatchStateMachine::ABannonMatchStateMachine() {
    PrimaryActorTick.bCanEverTick = true;
    CurrentState = EMatchState::Init;
}

void ABannonMatchStateMachine::TransitionToState(EMatchState NewState) {
    CurrentState = NewState;

    switch (CurrentState) {
        case EMatchState::PRE_MATCH_ENTRANCE:
        case EMatchState::EntranceRunning:
        case EMatchState::POST_MATCH_VICTORY:
        case EMatchState::VictorySequence:
            LockMatchMechanics(true);
            break;
        case EMatchState::MatchActive:
            LockMatchMechanics(false);
            break;
        case EMatchState::EntranceBrawl:
        case EMatchState::PostMatchBrawl:
            LockMatchMechanics(false); 
            break;
        default:
            break;
    }
}

void ABannonMatchStateMachine::LockMatchMechanics(bool bLock) {
    if (bLock) {
        UE_LOG(LogTemp, Log, TEXT("Match Timer and Ref Bell LOCKED."));
    } else {
        UE_LOG(LogTemp, Log, TEXT("Match Timer and Ref Bell UNLOCKED."));
    }
}

void ABannonMatchStateMachine::OnFighterHitRingApronVolume() {
    UE_LOG(LogTemp, Log, TEXT("Fighter hit ring apron volume. Locking physical handlers."));
    LockMatchMechanics(true);
}
