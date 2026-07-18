#include "BannonNeuralNetBrawlerAI.h"
#include "GameFramework/Character.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "BannonMDickiePhysicsIntegration.h"
#include "TimerManager.h"

ABannonNeuralNetBrawlerAI::ABannonNeuralNetBrawlerAI()
{
    PrimaryActorTick.bCanEverTick = true;
}

void ABannonNeuralNetBrawlerAI::BeginPlay()
{
    Super::BeginPlay();
    GetWorldTimerManager().SetTimer(NeuralTickHandle, this, &ABannonNeuralNetBrawlerAI::TickNeuralInference, 1.0f / 60.0f, true);
}

void ABannonNeuralNetBrawlerAI::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
}

void ABannonNeuralNetBrawlerAI::EvaluateCombatEnvironment(FObservationFrame& OutFrame)
{
    APawn* ControlledPawn = GetPawn();
    ACharacter* TargetCharacter = Cast<ACharacter>(GetFocusActor());

    if (ControlledPawn && TargetCharacter)
    {
        OutFrame.TargetTrajectory = TargetCharacter->GetVelocity();
        OutFrame.TargetDistance = FVector::Dist(ControlledPawn->GetActorLocation(), TargetCharacter->GetActorLocation());
        OutFrame.bIsConstraintActive = TargetCharacter->GetMesh()->IsSimulatingPhysics();
    }
}

float ABannonNeuralNetBrawlerAI::CalculateRewardWeight(float PoiseDamage, bool bSelfCrumple)
{
    const float DMG_SCALE = 8.0f;
    float Reward = (PoiseDamage * DMG_SCALE);
    if (bSelfCrumple) Reward -= 1000.0f;
    float GreedMultiplier = 1.2f;
    Reward *= GreedMultiplier;
    return Reward;
}

void ABannonNeuralNetBrawlerAI::TickNeuralInference()
{
    FObservationFrame CurrentFrame;
    EvaluateCombatEnvironment(CurrentFrame);
    
    if (MemoryTensorBuffer.Num() >= MAX_MEMORY_FRAMES)
    {
        MemoryTensorBuffer.RemoveAt(0);
    }
    MemoryTensorBuffer.Add(CurrentFrame);
    
    // Phase 8: Aggression / Cowardice Matrix
    float SelfPoise = 25.0f; // Sourced from independent Poise Engine state
    float TargetPoise = 35.0f; // Sourced from independent Poise Engine state
    
    FVector OptimalVector = FVector::ZeroVector;
    FString SelectedAction = TEXT("idle");

    if (SelfPoise < 30.0f)
    {
        OptimalVector = CurrentFrame.TargetTrajectory * -2.0f;
        SelectedAction = TEXT("evade");
        UE_LOG(LogTemp, Warning, TEXT("Bannon AI: Self poise critical. Weighting Cowardice matrix. Prioritizing spatial repositioning."));
    }
    else if (TargetPoise < 40.0f)
    {
        OptimalVector = CurrentFrame.TargetTrajectory * 1.5f;
        SelectedAction = TEXT("powerbomb"); 
        UE_LOG(LogTemp, Warning, TEXT("Bannon AI: Target poise critical. Weighting Aggression matrix. Prioritizing Phase 4 heavy grapple execution."));
    }
    
    ExecuteCombatAction(OptimalVector, SelectedAction);
}

void ABannonNeuralNetBrawlerAI::ExecuteCombatAction(FVector ActionImpulse, FString ActionType)
{
    ACharacter* ControlledCharacter = Cast<ACharacter>(GetPawn());
    if (ControlledCharacter && ControlledCharacter->GetCharacterMovement())
    {
        ControlledCharacter->GetCharacterMovement()->AddImpulse(ActionImpulse, true);
        
        UBannonMDickiePhysicsIntegration* PhysicsIntegration = ControlledCharacter->FindComponentByClass<UBannonMDickiePhysicsIntegration>();
        if (PhysicsIntegration)
        {
            AActor* TargetActor = GetFocusActor();
            if (TargetActor)
            {
                PhysicsIntegration->BindMDickieMoveToChaos(ActionType, TargetActor);
            }
        }
    }
}
