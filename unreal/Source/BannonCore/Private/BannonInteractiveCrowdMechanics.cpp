#include "BannonInteractiveCrowdMechanics.h"
#include "GameFramework/Character.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "Components/SkeletalMeshComponent.h"

UBannonInteractiveCrowdMechanics::UBannonInteractiveCrowdMechanics()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonInteractiveCrowdMechanics::EvaluateBarricadeTrajectory(ACharacter* ThrownActor, FVector BarricadeLocation)
{
    if (!ThrownActor || !ThrownActor->GetCharacterMovement()) return;

    const float MAX_BODY_VEL = 3.8f;
    FVector TrajectoryVector = ThrownActor->GetVelocity();
    float DistanceToBarricade = FVector::Dist(ThrownActor->GetActorLocation(), BarricadeLocation);

    // Predictive IK Trigger threshold
    if (DistanceToBarricade < 300.0f && TrajectoryVector.Size() > 500.0f)
    {
        UE_LOG(LogTemp, Warning, TEXT("Bannon Sandbox: Trajectory intercepts barricade. Triggering Crowd IK Catch/Push state."));

        // Deflection Impulse Calculation
        FVector DeflectionImpulse = -TrajectoryVector * 0.5f; 
        FVector VelocityVector = DeflectionImpulse / ThrownActor->GetCharacterMovement()->Mass;
        
        // Strict Velocity Cap Enforcement
        if (VelocityVector.Size() > (MAX_BODY_VEL * 100.f))
        {
            VelocityVector = VelocityVector.GetSafeNormal() * (MAX_BODY_VEL * 100.f);
            DeflectionImpulse = VelocityVector * ThrownActor->GetCharacterMovement()->Mass;
        }

        ThrownActor->GetCharacterMovement()->AddImpulse(DeflectionImpulse, true);
        UE_LOG(LogTemp, Warning, TEXT("Bannon Sandbox: Applied barricade deflection impulse clamped to MAX_BODY_VEL."));
    }
}
