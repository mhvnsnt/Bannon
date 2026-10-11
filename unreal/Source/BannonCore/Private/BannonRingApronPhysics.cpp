#include "BannonRingApronPhysics.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "Components/CapsuleComponent.h"

UBannonRingApronPhysics::UBannonRingApronPhysics()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonRingApronPhysics::BeginPlay()
{
    Super::BeginPlay();
}

void UBannonRingApronPhysics::CalculateApronCollision(ACharacter* Defender, FVector PushVelocity, float RingEdgeZ)
{
    if (!Defender) return;

    UCharacterMovementComponent* Movement = Defender->GetCharacterMovement();
    if (!Movement) return;

    // Detect if the character's root is crossing the ring boundary
    FVector ActorLoc = Defender->GetActorLocation();
    
    // Simulate sliding under the bottom rope
    // (Threshold based on standard ring geometry Z height delta)
    if (ActorLoc.Z <= RingEdgeZ + 50.0f) 
    {
        // Apply friction penalty and smooth the Z-axis descent to simulate sliding onto the apron
        FVector SlideVelocity = PushVelocity * 0.6f; // Friction reduction
        SlideVelocity.Z = -400.0f; // Controlled drop to apron
        
        Movement->AddImpulse(SlideVelocity, true);
        
        UE_LOG(LogTemp, Warning, TEXT("Bannon Physics: Apron slide triggered. Sliding under bottom rope."));
    }
    else
    {
        // Hard collision with ropes
        FVector ReboundVelocity = -PushVelocity * 0.4f;
        Movement->AddImpulse(ReboundVelocity, true);
        
        UE_LOG(LogTemp, Warning, TEXT("Bannon Physics: Ring edge collision. Rebounding off ropes."));
    }
}
