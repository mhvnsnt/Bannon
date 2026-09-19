// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonMotionMatching.generated.h"

USTRUCT(BlueprintType)
struct FBannonMotionTrajectoryPoint
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|MotionMatching")
	FVector Position = FVector::ZeroVector;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|MotionMatching")
	float HeadingAngle = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|MotionMatching")
	float AccumTime = 0.0f;
};

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonMotionMatching : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonMotionMatching();

	UFUNCTION(BlueprintCallable, Category="Bannon|MotionMatching")
	void UpdateMotionTrajectory(FVector DesiredVelocity, float DeltaTime);

	// Automated fluid weight shifts and procedural ring locomotion
	UFUNCTION(BlueprintCallable, Category="Bannon|MotionMatching")
	void CalculateWeightShift(float DeltaTime, const FVector& Acceleration);

	// Queries the UE5.4 Motion Database for the optimal pose based on trajectory cost
	UFUNCTION(BlueprintCallable, Category="Bannon|MotionMatching")
	FName QueryOptimalPose(float& OutCost);

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|MotionMatching")
	TArray<FBannonMotionTrajectoryPoint> FutureTrajectoryPoints;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|MotionMatching")
	FVector WeightShiftOffset;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|MotionMatching")
	float PoseCostThreshold;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|MotionMatching")
	FName ActiveLocomotionSchema;
};
