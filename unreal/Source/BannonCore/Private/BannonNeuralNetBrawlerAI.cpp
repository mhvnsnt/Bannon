#include "BannonNeuralNetBrawlerAI.h"
#include "BannonProceduralStrikeHitbox.h"
#include "GameFramework/Character.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "Components/CapsuleComponent.h"
#include "PhysicsEngine/PhysicsConstraintComponent.h"
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
    EvaluateSpatialAwarenessAndConstraints(DeltaTime);
}

void ABannonNeuralNetBrawlerAI::EvaluateSpatialAwarenessAndConstraints(float DeltaTime)
{
    // Simplified stub to represent MemoryTensorBuffer logic without needing full header definitions
    APawn* Pawn = GetPawn();
    if (!Pawn) return;

    FVector CurrentLocation = Pawn->GetActorLocation();
    
    // Abstracting boundary calculation
    FVector NearestRingBoundary = FVector(0.f, 0.f, 0.f); 
    float BoundaryDistance = FVector::Dist2D(CurrentLocation, NearestRingBoundary);

    float AggregateConstraintStress = 0.0f;
    // Iterating constraints would go here

    float CurrentPoise = 25.0f; // Sourced from Poise Engine
    float YieldThreshold = 85.0f; 
    
    if (CurrentPoise < (100.0f * 8.0f) && BoundaryDistance < 45.0f) 
    {
        UE_LOG(LogTemp, Warning, TEXT("Bannon AI: Self poise critical and trapped by ropes. Evade Lateral."));
    }
    else if (AggregateConstraintStress > YieldThreshold)
    {
        UE_LOG(LogTemp, Warning, TEXT("Bannon AI: Joint stress critical. Break Hold."));
    }
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
        
        OutFrame.DistanceToRopes = 100.0f; // Injected spatial geometry distance
        OutFrame.RopeAlignmentVector = FVector(0.f, 1.f, 0.f); // Orthogonal alignment vector
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
    
    float SelfPoise = 25.0f; // Sourced from independent Poise Engine state
    float TargetPoise = 35.0f; // Sourced from independent Poise Engine state
    
    FVector OptimalVector = FVector::ZeroVector;
    FString SelectedAction = TEXT("idle");

    if (SelfPoise < 30.0f)
    {
        if (CurrentFrame.DistanceToRopes < 150.0f)
        {
            // Spatial Risk Weighting
            OptimalVector = CurrentFrame.RopeAlignmentVector * 2.5f;
            SelectedAction = TEXT("ring_exit");
        }
        else
        {
            OptimalVector = CurrentFrame.TargetTrajectory * -2.0f;
            SelectedAction = TEXT("evade");
        }
    }
    else if (TargetPoise < 40.0f)
    {
        OptimalVector = CurrentFrame.TargetTrajectory * 1.5f;
        SelectedAction = TEXT("powerbomb"); 
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
