#include "BannonEntranceSystem.h"
#include "BannonMatchStateMachine.h"
#include "Engine/World.h"
#include "Kismet/GameplayStatics.h"

UBannonEntranceSystem::UBannonEntranceSystem() {
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonEntranceSystem::TriggerEntrance(const FString& CharacterId) {
    UE_LOG(LogTemp, Log, TEXT("Triggering Entrance Timeline for %s. Loading pyrotechnics and lighting scripts."), *CharacterId);
}

void UBannonEntranceSystem::InterruptEntrance(const FString& AttackerId, bool bIsAIAutonomous) {
    UE_LOG(LogTemp, Warning, TEXT("Entrance Interrupted by %s! AI Autonomous: %d"), *AttackerId, bIsAIAutonomous);
    
    // Find FSM and switch state to ENTRANCE_BRAWL
    AActor* FSM = UGameplayStatics::GetActorOfClass(GetWorld(), ABannonMatchStateMachine::StaticClass());
    if (FSM) {
        Cast<ABannonMatchStateMachine>(FSM)->TransitionToState(EMatchState::EntranceBrawl);
    }
}

void UBannonEntranceSystem::PlayTTSBragLine(const FString& DialogueId) {
    // Triggers local Piper / Coqui TTS via VoiceMapper
    UE_LOG(LogTemp, Log, TEXT("Streaming TTS Brag Line: %s"), *DialogueId);
}
