// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonFBIKComponent.generated.h"

USTRUCT(BlueprintType)
struct FBannonIKTargetData
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|IK")
	FVector TargetLocation = FVector::ZeroVector;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|IK")
	float ReachAlpha = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|IK")
	FName JointSocketName = NAME_None;
};

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonFBIKComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonFBIKComponent();

	UFUNCTION(BlueprintCallable, Category="Bannon|IK")
	void UpdateFootPlacement(FVector LeftFootTarget, FVector RightFootTarget);

	UFUNCTION(BlueprintCallable, Category="Bannon|IK")
	void UpdateGrappleHandPlacement(FVector TargetBonePosition);

	// Maps full-body IK structures to support procedural hand-placement for rope grapples and turnbuckles
	UFUNCTION(BlueprintCallable, Category="Bannon|IK")
	void SnapHandToRope(FVector RopeLocation, bool bIsLeftHand, float EaseDuration);

	UFUNCTION(BlueprintCallable, Category="Bannon|IK")
	void SnapHandToTurnbuckle(FVector TurnbuckleLocation, bool bIsLeftHand, float EaseDuration);

	// Adjusts skeletal structures for grappling opponents of significantly varying physical proportions
	UFUNCTION(BlueprintCallable, Category="Bannon|IK")
	void AdjustGrappleForProportions(float OpponentHeight, float OpponentWeight, const FName& TargetBoneName);

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|IK")
	FBannonIKTargetData LeftHandTarget;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|IK")
	FBannonIKTargetData RightHandTarget;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|IK")
	float ProportionAdjustmentScale;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|IK")
	bool bIsIKActive;
};
