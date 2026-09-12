#include "BannonRopePhysicsSimulationVerlet.h"
#include "GameFramework/Character.h"
#include "Components/SkeletalMeshComponent.h"
#include "Animation/AnimInstance.h"
#include "Kismet/KismetMathLibrary.h"

UBannonRopePhysicsSimulationVerlet::UBannonRopePhysicsSimulationVerlet()
{
    PrimaryComponentTick.bCanEverTick = false;
    RopeSnapBackForceMultiplier = 1.2f;
}

void UBannonRopePhysicsSimulationVerlet::CalculateRopeTension(float BodyMass, float ImpactVelocity)
{
    float TensionForce = BodyMass * ImpactVelocity * RopeSnapBackForceMultiplier;
    
    ACharacter* OwnerCharacter = Cast<ACharacter>(GetOwner());
    if (OwnerCharacter && OwnerCharacter->GetMesh())
    {
        // Apply Verlet snap-back force vector to the rigid body
        FVector SnapBackVector = OwnerCharacter->GetActorForwardVector() * -TensionForce;
        OwnerCharacter->GetMesh()->AddImpulse(SnapBackVector, NAME_None, true);
        
        // Deep AnimGraph Binding: Trigger rope bounce state
        UAnimInstance* AnimInst = OwnerCharacter->GetMesh()->GetAnimInstance();
        if (AnimInst)
        {
            FFloatProperty* BounceProp = FindFProperty<FFloatProperty>(AnimInst->GetClass(), FName("RopeBounceForce"));
            if (BounceProp)
            {
                BounceProp->SetPropertyValue_InContainer(AnimInst, TensionForce);
            }
        }
    }
    
    UE_LOG(LogTemp, Warning, TEXT("Bannon Physics: Rope tension calculated %f. Applying Verlet snap-back force."), TensionForce);
}
