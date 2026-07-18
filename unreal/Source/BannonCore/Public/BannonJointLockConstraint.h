// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonJointLockConstraint.generated.h"

USTRUCT(BlueprintType)
struct FBannonJointStressData
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Submission")
	float CurrentStress = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Submission")
	float StressLimit = 100.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Submission")
	bool bIsTorn = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Submission")
	bool bIsDislocated = false;
};

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonJointLockConstraint : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonJointLockConstraint();

	// Torque-Based Joint Locks (simulated torque measuring angle limit breaks)
	UFUNCTION(BlueprintCallable, Category="Bannon|Submission")
	void ApplyJointTorque(class ACharacter* Attacker, class ACharacter* Defender, FName TargetBone, float BaseTorque);

	// Submission Leverage Scaling based on height/mass delta
	UFUNCTION(BlueprintCallable, Category="Bannon|Submission")
	float CalculateLeverageMultiplier(class ACharacter* Attacker, class ACharacter* Defender);

	// Tracks stress and handles dynamic joint constraint tearing (joint hyper-extension)
	UFUNCTION(BlueprintCallable, Category="Bannon|Submission")
	void UpdateTearingStress(FName TargetBone, float TorqueApplied, float DeltaTime);

	// Inflicts joint dislocation/tearing penalty
	UFUNCTION(BlueprintCallable, Category="Bannon|Submission")
	void TriggerJointTear(FName TargetBone);

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Submission")
	TMap<FName, FBannonJointStressData> JointStressMap;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Submission")
	float TearThresholdTorque;
};
