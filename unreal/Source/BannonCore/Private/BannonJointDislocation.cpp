#include "BannonJointDislocation.h"

UBannonJointDislocation::UBannonJointDislocation()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonJointDislocation::BeginPlay()
{
    Super::BeginPlay();
}

void UBannonJointDislocation::EvaluateConstraintLimit(FName JointName, float CurrentTorque, float BreakingThreshold)
{
    if (CurrentTorque >= BreakingThreshold && !DislocatedJoints.Contains(JointName))
    {
        UE_LOG(LogTemp, Warning, TEXT("Bannon Medical: JOINT DISLOCATION! %s exceeded torque limit (%f >= %f)"), *JointName.ToString(), CurrentTorque, BreakingThreshold);
        ApplyPermanentLimbPenalty(JointName);
    }
}

void UBannonJointDislocation::ApplyPermanentLimbPenalty(FName JointName)
{
    DislocatedJoints.Add(JointName);
    // Apply IK failure or permanent debuff to the limb
    UE_LOG(LogTemp, Warning, TEXT("Bannon Medical: Permanent penalty applied to %s for the remainder of the match."), *JointName.ToString());
}
