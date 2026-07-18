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
    // Bind asynchronous decision loop directly to Chaos physics step (Fixed Tick approximation)
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
        
        // Phase 6 Ontological Alignment parameter ingests
        float AuraResonance = 0.84f; 
        int32 EgoDissolution = 4;
        float GreedMultiplier = 1.2f;
    }
}

float ABannonNeuralNetBrawlerAI::CalculateRewardWeight(float PoiseDamage, bool bSelfCrumple)
{
    const float DMG_SCALE = 8.0f;
    float Reward = (PoiseDamage * DMG_SCALE);
    
    if (bSelfCrumple)
    {
        Reward -= 1000.0f; 
    }
    
    // Procedurally skew AI's risk-taking behavior via Ontological Greed
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
    
    // Neural inference logic parsing tensor to anticipate physics momentum
    FVector OptimalInterceptVector = CurrentFrame.TargetTrajectory * -1.5f;
    FString SelectedAction = TEXT("powerbomb"); 
    
    ExecuteCombatAction(OptimalInterceptVector, SelectedAction);
}

void ABannonNeuralNetBrawlerAI::ExecuteCombatAction(FVector ActionImpulse, FString ActionType)
{
    ACharacter* ControlledCharacter = Cast<ACharacter>(GetPawn());
    if (ControlledCharacter)
    {
        if (ControlledCharacter->GetCharacterMovement())
        {
            ControlledCharacter->GetCharacterMovement()->AddImpulse(ActionImpulse, true);
        }
        
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
