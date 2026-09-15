#include "BannonDynamicJointConstraintTearing.h"
#include "GameFramework/Character.h"
#include "Components/SkeletalMeshComponent.h"
#include "Animation/AnimInstance.h"

UBannonDynamicJointConstraintTearing::UBannonDynamicJointConstraintTearing()
{
    PrimaryComponentTick.bCanEverTick = false;
    TearThreshold = 5000.0f;
}

void UBannonDynamicJointConstraintTearing::SimulateHyperExtension(FName JointName, float AppliedTorque)
{
    if (AppliedTorque >= TearThreshold)
    {
        ACharacter* OwnerCharacter = Cast<ACharacter>(GetOwner());
        if (OwnerCharacter)
        {
            USkeletalMeshComponent* Mesh = OwnerCharacter->GetMesh();
            if (Mesh)
            {
                // Break the physics constraint at the specified joint
                Mesh->BreakConstraint(AppliedTorque, Mesh->GetBoneLocation(JointName), JointName);
                
                // Deep AnimGraph Binding: Notify AnimInstance of severe injury to alter locomotion blending
                UAnimInstance* AnimInst = Mesh->GetAnimInstance();
                if (AnimInst)
                {
                    FName PropertyName = FName(FString::Printf(TEXT("bIs%sTorn"), *JointName.ToString()));
                    FBoolProperty* BoolProp = FindFProperty<FBoolProperty>(AnimInst->GetClass(), PropertyName);
                    if (BoolProp)
                    {
                        BoolProp->SetPropertyValue_InContainer(AnimInst, true);
                    }
                }
            }
        }
        UE_LOG(LogTemp, Error, TEXT("Bannon Physics: Constraint Tearing triggered on joint %s (Torque: %f). Permanent injury applied."), *JointName.ToString(), AppliedTorque);
    }
}
