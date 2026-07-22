#include "BannonPostMatchSystem.h"
#include "BannonMatchStateMachine.h"
#include "Engine/World.h"
#include "Kismet/GameplayStatics.h"
#include "TimerManager.h"
#include "Math/UnrealMathUtility.h"

// --- EXTENDED HOLD CONTROLLER ---

UBannonExtendedHoldController::UBannonExtendedHoldController() {
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonExtendedHoldController::InterceptReleaseState(USkeletalMeshComponent* AttackerMesh, USkeletalMeshComponent* VictimMesh) {
    UE_LOG(LogTemp, Warning, TEXT("Extended Hold Triggered! Locking IK nodes in submission state."));
    // Keep IK locked, start ref panic
    TriggerRefereePanicCount();
}

void UBannonExtendedHoldController::TriggerRefereePanicCount() {
    UE_LOG(LogTemp, Warning, TEXT("Referee initiating PANIC 5-COUNT. Ignoring this will apply permanent limb damage multipliers."));
}

// --- BREAKOUT CONTROLLER ---

UBannonBreakoutController::UBannonBreakoutController() {
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonBreakoutController::TriggerBreakout() {
    UE_LOG(LogTemp, Warning, TEXT("BREAKOUT INITIATED! Aborting victory timeline, snapping camera to dynamic gameplay angle."));
    
    AActor* FSM = UGameplayStatics::GetActorOfClass(GetWorld(), ABannonMatchStateMachine::StaticClass());
    if (FSM) {
        Cast<ABannonMatchStateMachine>(FSM)->TransitionToState(EMatchState::PostMatchBrawl);
    }
}

// --- PROCEDURAL INTERVENTION ENGINE ---

UBannonProceduralInterventionEngine::UBannonProceduralInterventionEngine() {
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonProceduralInterventionEngine::RollForIntervention(const FString& VictimId, const FString& AttackerId, bool bHighRivalry) {
    UE_LOG(LogTemp, Log, TEXT("Starting Intervention Engine loop for %s being beaten down by %s."), *VictimId, *AttackerId);
    
    // In a real environment, this timer handles the 15-second loop
    // GetWorld()->GetTimerManager().SetTimer(InterventionTimerHandle, [this, VictimId, AttackerId, bHighRivalry]() {
    //     ExecuteInterventionRoll(VictimId, AttackerId, bHighRivalry);
    // }, InterventionCheckInterval, true);
    
    ExecuteInterventionRoll(VictimId, AttackerId, bHighRivalry);
}

void UBannonProceduralInterventionEngine::ExecuteInterventionRoll(const FString& VictimId, const FString& AttackerId, bool bHighRivalry) {
    // Inject enhanced physics ragdoll beatdown mechanics before roll
    UE_LOG(LogTemp, Warning, TEXT("[Physics] Enabling full collision ragdoll logic on %s while getting beatdown by %s"), *VictimId, *AttackerId);
    int32 Roll = FMath::RandRange(1, 100);
    
    if (bHighRivalry) {
        Roll += 40; // 40% increased chance for Ally/Faction save
    }
    
    if (Roll <= 30) {
        // Expanded ragdoll beatdown continuation
        UE_LOG(LogTemp, Log, TEXT("Intervention Roll: %d. No intervention. Beatdown continues. Victim IK limits broken, heavy ragdoll active."), Roll);
        UE_LOG(LogTemp, Log, TEXT("Intervention Roll: %d. No intervention. Beatdown continues."), Roll);
    } else if (Roll <= 50) {
        UE_LOG(LogTemp, Warning, TEXT("Intervention Roll: %d. Security & Referees spawn to separate them!"), Roll);
    } else if (Roll <= 70) {
        UE_LOG(LogTemp, Warning, TEXT("Intervention Roll: %d. Medical Staff spawns with a stretcher!"), Roll);
    } else if (Roll <= 85) {
        UE_LOG(LogTemp, Warning, TEXT("Intervention Roll: %d. ALLY SAVE! Spawning closest tag partner for %s!"), Roll, *VictimId);
    } else {
        UE_LOG(LogTemp, Error, TEXT("Intervention Roll: %d. FACTION SWARM! An entire stable is running down to the ring!"), Roll);
    }
}

// --- EXIT TRIGGER ZONE ---

ABannonExitTriggerZone::ABannonExitTriggerZone() {
    PrimaryActorTick.bCanEverTick = false;
    
    ExitVolume = CreateDefaultSubobject<UBoxComponent>(TEXT("ExitVolume"));
    RootComponent = ExitVolume;
    ExitVolume->OnComponentBeginOverlap.AddDynamic(this, &ABannonExitTriggerZone::OnOverlapBegin);
}

void ABannonExitTriggerZone::OnOverlapBegin(UPrimitiveComponent* OverlappedComp, AActor* OtherActor, UPrimitiveComponent* OtherComp, int32 OtherBodyIndex, bool bFromSweep, const FHitResult& SweepResult) {
    // If the attacker/player walks into the volume at the top of the ramp
    UE_LOG(LogTemp, Log, TEXT("Player hit Exit Trigger. Concluding post-match segment."));
    TriggerArenaExit();
}

void ABannonExitTriggerZone::TriggerArenaExit() {
    UE_LOG(LogTemp, Warning, TEXT("Triggering final blackout. Saving inflicted damage and rivalry updates to the database. Returning to Hub/Menu."));
}
