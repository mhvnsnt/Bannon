// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "BannonALSMovementComponent.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonALSMovementComponent : public UCharacterMovementComponent
{
	GENERATED_BODY()

public:
	UBannonALSMovementComponent();

	// Seamless 8-way directional movement blending
	UFUNCTION(BlueprintCallable, Category="Bannon|Locomotion")
	void SetLocomotionState(FName NewState);

	// Handling transitions to active ragdoll states
	UFUNCTION(BlueprintCallable, Category="Bannon|Locomotion")
	void TriggerGetUpAnimation();
};
