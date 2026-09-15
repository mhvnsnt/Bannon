#include "BannonDynamicIKRigging.h"
#include "Components/SkeletalMeshComponent.h"

void UBannonDynamicIKRigging::WireFullBodyIKTurnbuckle(USkeletalMeshComponent* AttackerMesh, FVector TurnbuckleLocation, FVector& OutLeftHandIK, FVector& OutRightHandIK)
{
    if (!AttackerMesh) return;
    const FVector LocalOffsetLeft(-15.0f, 20.0f, 0.0f);
    const FVector LocalOffsetRight(15.0f, 20.0f, 0.0f);
    OutLeftHandIK = TurnbuckleLocation + LocalOffsetLeft;
    OutRightHandIK = TurnbuckleLocation + LocalOffsetRight;
}

void UBannonDynamicIKRigging::CalculateRopeWalkFootPlacement(USkeletalMeshComponent* AttackerMesh, FVector RopeSplineLocation, float BalanceDelta, FVector& OutLeftFootIK, FVector& OutRightFootIK)
{
    if (!AttackerMesh) return;

    const FVector FootOffset(0.0f, 14.0f, 0.0f);
    const float BoundedBalance = FMath::Clamp(BalanceDelta, -1.0f, 1.0f);
    const FVector BalanceCorrection(0.0f, 0.0f, BoundedBalance * 2.5f);

    OutLeftFootIK = RopeSplineLocation - FootOffset + BalanceCorrection;
    OutRightFootIK = RopeSplineLocation + FootOffset - BalanceCorrection;

    // This component produces IK targets only. It never mutates the skeletal
    // component, actor transform, capsule, or animation instance.
}

void UBannonDynamicIKRigging::MapHeightDependentGrappleIK(USkeletalMeshComponent* AttackerMesh, USkeletalMeshComponent* DefenderMesh, FName TargetBone, FVector& OutIKLocation)
{
    if (!AttackerMesh || !DefenderMesh || !DefenderMesh->DoesSocketExist(TargetBone)) return;

    const FVector AttackerRoot = AttackerMesh->GetComponentLocation();
    const FVector DefenderRoot = DefenderMesh->GetComponentLocation();
    const FVector TargetSocketLocation = DefenderMesh->GetSocketLocation(TargetBone);

    const float ZHeightDelta = DefenderRoot.Z - AttackerRoot.Z;
    const FVector HeightAdjustment(0.0f, 0.0f, FMath::Clamp(ZHeightDelta * 0.45f, -50.0f, 50.0f));

    OutIKLocation = TargetSocketLocation + HeightAdjustment;
}
