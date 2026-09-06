#include "BannonSubwayTrainInteractivity.h"
#include "GameFramework/Character.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "Animation/AnimInstance.h"

UBannonSubwayTrainInteractivity::UBannonSubwayTrainInteractivity()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonSubwayTrainInteractivity::ApplyInertialPhysicsToFighters(TArray<AActor*> Occupants, FVector TrainVelocity)
{
    for (AActor* Fighter : Occupants)
    {
        ACharacter* Char = Cast<ACharacter>(Fighter);
        if (Char && Char->GetCharacterMovement())
        {
            // Transfer inertial physics vector
            Char->GetCharacterMovement()->AddImpulse(TrainVelocity * Char->GetCharacterMovement()->Mass, true);
            
            // Deep AnimGraph Binding: Inertial stagger blending
            UAnimInstance* AnimInst = Char->GetMesh()->GetAnimInstance();
            if (AnimInst)
            {
                FVectorProperty* VectorProp = FindFProperty<FVectorProperty>(AnimInst->GetClass(), FName("InertialForceVector"));
                if (VectorProp)
                {
                    VectorProp->SetPropertyValue_InContainer(AnimInst, TrainVelocity);
                }
            }
            
            UE_LOG(LogTemp, Warning, TEXT("Bannon Sandbox: Applied subway inertial physics vector %s to fighter %s."), *TrainVelocity.ToString(), *Fighter->GetName());
        }
    }
}
