#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "RTIKSolver.h"
#include "BannonGrappleIKBridge.generated.h"

UCLASS()
class BANNONCORE_API UBannonGrappleIKBridge : public UObject
{
	GENERATED_BODY()

public:
	UBannonGrappleIKBridge();

	// The active instance of the open-source solver
	FRTIKSolver IKSolver;

	// Anchors to Bannon Physics Constants (Mandatory limiters)
	static constexpr float MAX_HP = 10000.0f;
	static constexpr float DMG_SCALE = 8.0f;
	static constexpr float MAX_BODY_VEL = 3.8f; // m/s

	// Executes the external solver but constrained by the poise/stamina network
	UFUNCTION(BlueprintCallable, Category = "Bannon|IK")
	void ExecuteConstrainedGrappleIK(TArray<FTransform>& BoneTransforms, float PoiseValue, float CurrentHP, float DeltaTime);

	// Enforce crumple state coupling
	UFUNCTION(BlueprintCallable, Category = "Bannon|IK")
	void ValidateCrumpleState(float PoiseValue);
};
