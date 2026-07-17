// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonJointLockConstraint.generated.h"

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
};
