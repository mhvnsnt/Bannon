// Copyright BANNON.

#include "BannonMotionMatching.h"

UBannonMotionMatching::UBannonMotionMatching()
{
	PrimaryComponentTick.bCanEverTick = true;
	PoseCostThreshold = 0.08f;
	ActiveLocomotionSchema = TEXT("Ring_Brawling_Schema");
	WeightShiftOffset = FVector::ZeroVector;
}

void UBannonMotionMatching::UpdateMotionTrajectory(FVector DesiredVelocity, float DeltaTime)
{
	FutureTrajectoryPoints.Empty();

	// Generate 3 prediction points into the future (0.2s, 0.4s, 0.6s) to create the motion matching trajectory history
	float TimeSteps[3] = { 0.2f, 0.4f, 0.6f };
	FVector CurrentPos = FVector::ZeroVector;

	for (int32 idx = 0; idx < 3; ++idx)
	{
		FBannonMotionTrajectoryPoint Pt;
		Pt.AccumTime = TimeSteps[idx];
		Pt.Position = CurrentPos + (DesiredVelocity * Pt.AccumTime);
		
		// Align heading angle relative to the velocity vector
		if (!DesiredVelocity.IsNearlyZero())
		{
			Pt.HeadingAngle = FMath::RadiansToDegrees(FMath::Atan2(DesiredVelocity.Y, DesiredVelocity.X));
		}
		else
		{
			Pt.HeadingAngle = 0.0f;
		}

		FutureTrajectoryPoints.Add(Pt);
	}
}

void UBannonMotionMatching::CalculateWeightShift(float DeltaTime, const FVector& Acceleration)
{
	// Calculate fluid weight shift for ring brawling (momentum-based leaning)
	// Larger accelerations or sharp stops/turns lean the spine and hips into the turn
	FVector TargetShift = -Acceleration * 0.05f; // Opposite to acceleration vector
	TargetShift.Z = FMath::Clamp(TargetShift.Z, -10.0f, 10.0f); // Limit vertical compression
	TargetShift.X = FMath::Clamp(TargetShift.X, -25.0f, 25.0f);
	TargetShift.Y = FMath::Clamp(TargetShift.Y, -25.0f, 25.0f);

	WeightShiftOffset = FMath::VInterpTo(WeightShiftOffset, TargetShift, DeltaTime, 8.0f);
}

FName UBannonMotionMatching::QueryOptimalPose(float& OutCost)
{
	// Automated database query simulation comparing predicted trajectory vs asset library
	// Simulating search on database schema files
	
	if (FutureTrajectoryPoints.Num() == 0)
	{
		OutCost = 0.0f;
		return TEXT("Pose_Idle_Stand");
	}

	float TrajectoryMagnitude = FutureTrajectoryPoints[2].Position.Size();
	
	if (TrajectoryMagnitude < 5.0f)
	{
		OutCost = 0.01f;
		return TEXT("Pose_Idle_Ring_Guard");
	}

	// Calculate a pseudo-cost to return the best-matching stride length or turning pose
	float HeadingAngle = FutureTrajectoryPoints[2].HeadingAngle;
	
	if (FMath::Abs(HeadingAngle) > 45.0f)
	{
		OutCost = 0.04f;
		return HeadingAngle > 0.0f ? TEXT("Pose_Loco_Walk_Turn_L") : TEXT("Pose_Loco_Walk_Turn_R");
	}

	OutCost = 0.02f;
	return TEXT("Pose_Loco_Jog_Forward_8Way");
}
