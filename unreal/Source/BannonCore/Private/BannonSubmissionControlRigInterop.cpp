#include "BannonSubmissionControlRigInterop.h"
#include "Components/SkeletalMeshComponent.h"
#include "Animation/AnimInstance.h"

UBannonSubmissionControlRigInterop::UBannonSubmissionControlRigInterop()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonSubmissionControlRigInterop::InjectJointDeformation(USkeletalMeshComponent* Mesh, FName TargetJoint, float AppliedTorque)
{
    if (Mesh && Mesh->GetAnimInstance())
    {
        UAnimInstance* AnimInst = Mesh->GetAnimInstance();
        
        // Map the Chaos torque directly into the UE5 Control Rig variables for visual bone deformation
        FName TorqueParamName = FName(FString::Printf(TEXT("%s_DeformationTorque"), *TargetJoint.ToString()));
        FFloatProperty* TorqueProp = FindFProperty<FFloatProperty>(AnimInst->GetClass(), TorqueParamName);
        
        if (TorqueProp)
        {
            TorqueProp->SetPropertyValue_InContainer(AnimInst, AppliedTorque);
            UE_LOG(LogTemp, Warning, TEXT("Bannon Physics: Bound Submission Torque %f to UE5 Control Rig Joint %s"), AppliedTorque, *TargetJoint.ToString());
        }
    }
}
