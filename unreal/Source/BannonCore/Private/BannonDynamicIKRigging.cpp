#include "BannonDynamicIKRigging.h"
#include "Components/SkeletalMeshComponent.h"
#include "GameFramework/Character.h"
#include "Kismet/KismetMathLibrary.h"

void UBannonDynamicIKRigging::WireFullBodyIKTurnbuckle(USkeletalMeshComponent* AttackerMesh, FVector TurnbuckleLocation, FVector& OutLeftHandIK, FVector& OutRightHandIK)
{
    if (!AttackerMesh) return;

    FVector LocalOffsetLeft = FVector(-15.0f, 20.0f, 0.0f);
    FVector LocalOffsetRight = FVector(15.0f, 20.0f, 0.0f);

    OutLeftHandIK = TurnbuckleLocation + LocalOffsetLeft;
    OutRightHandIK = TurnbuckleLocation + LocalOffsetRight;
}

void UBannonDynamicIKRigging::CalculateRopeWalkFootPlacement(USkeletalMeshComponent* AttackerMesh, FVector RopeSplineLocation, float BalanceDelta, FVector& OutLeftFootIK, FVector& OutRightFootIK)
{
    if (!AttackerMesh) return;

    FVector FootOffset = FVector(0.0f, 14.0f, 0.0f);
    FVector BalanceCorrection = FVector(0.0f, 0.0f, BalanceDelta * 2.5f);

    OutLeftFootIK = RopeSplineLocation - FootOffset + BalanceCorrection;
    OutRightFootIK = RopeSplineLocation + FootOffset - BalanceCorrection;
}

void UBannonDynamicIKRigging::MapHeightDependentGrappleIK(USkeletalMeshComponent* AttackerMesh, USkeletalMeshComponent* DefenderMesh, FName TargetBone, FVector& OutIKLocation)
{
    if (!AttackerMesh || !DefenderMesh) return;

    FVector AttackerRoot = AttackerMesh->GetComponentLocation();
    FVector DefenderRoot = DefenderMesh->GetComponentLocation();
    FVector TargetSocketLocation = DefenderMesh->GetSocketLocation(TargetBone);

    float ZHeightDelta = DefenderRoot.Z - AttackerRoot.Z;
    FVector HeightAdjustment = FVector(0.0f, 0.0f, ZHeightDelta * 0.45f);

    OutIKLocation = TargetSocketLocation + HeightAdjustment;
}
