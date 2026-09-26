#include "BannonHitReactionStepBack.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "Components/CapsuleComponent.h"

UBannonHitReactionStepBack::UBannonHitReactionStepBack()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonHitReactionStepBack::BeginPlay()
{
    Super::BeginPlay();
}

void UBannonHitReactionStepBack::ApplyHitDisplacement(ACharacter* Defender, FVector ImpactForce, float MassRatio)
{
    if (!Defender) return;

    UCharacterMovementComponent* Movement = Defender->GetCharacterMovement();
    if (!Movement) return;

    // Convert strike impact force into UE5 world space physical displacement
    // This prevents the animation from 'skating' or staying locked in place
    // by pushing the root capsule backwards based on the force vector and mass ratio
    
    FVector StepBackVelocity = ImpactForce * MassRatio * 1.5f; // Multiplier for root displacement
    
    // Apply displacement directly to the capsule root movement to synchronize with the hit reaction animation
    Movement->AddImpulse(StepBackVelocity, true);
    
    // Temporarily increase ground friction to stop sliding after the step back
    Movement->GroundFriction = 8.0f;
}
