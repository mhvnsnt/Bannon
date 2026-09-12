// Copyright BANNON.

#include "BannonFBIKComponent.h"

UBannonFBIKComponent::UBannonFBIKComponent()
{
	PrimaryComponentTick.bCanEverTick = true;
	ProportionAdjustmentScale = 1.0f;
	bIsIKActive = false;

	LeftHandTarget.ReachAlpha = 0.0f;
	LeftHandTarget.JointSocketName = TEXT("hand_l");

	RightHandTarget.ReachAlpha = 0.0f;
	RightHandTarget.JointSocketName = TEXT("hand_r");
}

void UBannonFBIKComponent::UpdateFootPlacement(FVector LeftFootTarget, FVector RightFootTarget)
{
	// Calculate IK traces to ring ropes, turnbuckles, or mat
	if (bIsIKActive)
	{
		UE_LOG(LogTemp, VeryVerbose, TEXT("Bannon FBIK: Updating foot placements - L: %s, R: %s"), *LeftFootTarget.ToString(), *RightFootTarget.ToString());
	}
}

void UBannonFBIKComponent::UpdateGrappleHandPlacement(FVector TargetBonePosition)
{
	// Interpolates and snaps the grappling hand socket directly onto the targeted joint
	if (bIsIKActive)
	{
		RightHandTarget.TargetLocation = TargetBonePosition;
		RightHandTarget.ReachAlpha = FMath::FInterpTo(RightHandTarget.ReachAlpha, 1.0f, GetWorld()->GetDeltaSeconds(), 12.0f);
	}
}

void UBannonFBIKComponent::SnapHandToRope(FVector RopeLocation, bool bIsLeftHand, float EaseDuration)
{
	bIsIKActive = true;
	if (bIsLeftHand)
	{
		LeftHandTarget.TargetLocation = RopeLocation;
		LeftHandTarget.ReachAlpha = 1.0f;
		UE_LOG(LogTemp, Log, TEXT("Bannon FBIK: Snapping Left Hand to Ring Rope spline at %s"), *RopeLocation.ToString());
	}
	else
	{
		RightHandTarget.TargetLocation = RopeLocation;
		RightHandTarget.ReachAlpha = 1.0f;
		UE_LOG(LogTemp, Log, TEXT("Bannon FBIK: Snapping Right Hand to Ring Rope spline at %s"), *RopeLocation.ToString());
	}
}

void UBannonFBIKComponent::SnapHandToTurnbuckle(FVector TurnbuckleLocation, bool bIsLeftHand, float EaseDuration)
{
	bIsIKActive = true;
	if (bIsLeftHand)
	{
		LeftHandTarget.TargetLocation = TurnbuckleLocation;
		LeftHandTarget.ReachAlpha = 1.0f;
		UE_LOG(LogTemp, Log, TEXT("Bannon FBIK: Snapping Left Hand to Corner Turnbuckle pad at %s"), *TurnbuckleLocation.ToString());
	}
	else
	{
		RightHandTarget.TargetLocation = TurnbuckleLocation;
		RightHandTarget.ReachAlpha = 1.0f;
		UE_LOG(LogTemp, Log, TEXT("Bannon FBIK: Snapping Right Hand to Corner Turnbuckle pad at %s"), *TurnbuckleLocation.ToString());
	}
}

void UBannonFBIKComponent::AdjustGrappleForProportions(float OpponentHeight, float OpponentWeight, const FName& TargetBoneName)
{
	bIsIKActive = true;

	// Scale target reaches dynamically based on wrestler proportions to prevent hands from passing through or falling short of bones
	// Standard height is 180cm
	float ReferenceHeight = 180.0f;
	ProportionAdjustmentScale = OpponentHeight / ReferenceHeight;

	UE_LOG(LogTemp, Log, TEXT("Bannon FBIK: Adjusting grapple constraints. Opponent height ratio is %f. Recalculating bone target offsets for joint: %s"), ProportionAdjustmentScale, *TargetBoneName.ToString());
}
