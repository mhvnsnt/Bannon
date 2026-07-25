#include "BannonConcussionDazeState.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "Components/SkeletalMeshComponent.h"

UBannonConcussionDazeState::UBannonConcussionDazeState()
{
    PrimaryComponentTick.bCanEverTick = true;
    BaseWobbleIntensity = 1.0f;
    StaggerDuration = 0.0f;
}

void UBannonConcussionDazeState::BeginPlay()
{
    Super::BeginPlay();
}

void UBannonConcussionDazeState::TriggerConcussionStagger(ACharacter* Defender, float HeadTraumaLevel, float CurrentHealth)
{
    if (!Defender) return;

    // Check critical thresholds
    bool bCriticalHealth = CurrentHealth < 20.0f;
    bool bHighTrauma = HeadTraumaLevel > 75.0f;

    if (bCriticalHealth || bHighTrauma)
    {
        USkeletalMeshComponent* Mesh = Defender->GetMesh();
        if (Mesh)
        {
            // Trigger physical animation profile to loosen neck/spine constraints
            // Blending a physics-driven wobble over the idle animation
            Mesh->SetAllBodiesBelowSimulatePhysics(TEXT("Spine_02"), true, true);
            Mesh->SetAllBodiesBelowPhysicsBlendWeight(TEXT("Spine_02"), 0.6f * (HeadTraumaLevel / 100.0f));
            
            // Add lateral force to simulate stagger/loss of balance
            FVector WobbleForce = FVector(FMath::RandRange(-50.0f, 50.0f), FMath::RandRange(-50.0f, 50.0f), 0.0f);
            Mesh->AddImpulse(WobbleForce * Mesh->GetMass(), TEXT("head"), true);
        }
    }
}
