#include "BannonVictorySystem.h"
#include "BannonMatchStateMachine.h"
#include "Engine/World.h"
#include "Kismet/GameplayStatics.h"

UBannonVictorySystem::UBannonVictorySystem() {
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonVictorySystem::TriggerVictorySequence(const FString& WinnerId, const FString& WinMethod) {
    UE_LOG(LogTemp, Log, TEXT("%s wins via %s! Locking losers inputs, firing dynamic voice lines."), *WinnerId, *WinMethod);
    
    AActor* FSM = UGameplayStatics::GetActorOfClass(GetWorld(), ABannonMatchStateMachine::StaticClass());
    if (FSM) {
        Cast<ABannonMatchStateMachine>(FSM)->TransitionToState(EMatchState::VictorySequence);
    }
}

void UBannonVictorySystem::InitiatePostMatchBeatdown() {
    UE_LOG(LogTemp, Warning, TEXT("Winner opted for POST MATCH BEATDOWN! Transitioning FSM..."));
    
    AActor* FSM = UGameplayStatics::GetActorOfClass(GetWorld(), ABannonMatchStateMachine::StaticClass());
    if (FSM) {
        Cast<ABannonMatchStateMachine>(FSM)->TransitionToState(EMatchState::PostMatchBrawl);
    }
}
