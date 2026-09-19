// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonCounterMatrix.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonCounterMatrix : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonCounterMatrix();

	// Mid-Air Grapple Interceptions
	UFUNCTION(BlueprintCallable, Category="Bannon|Grapple")
	void InterceptMidAir(class ACharacter* Attacker, class ACharacter* AirborneDefender);

	// Counter-Reversal Physics Blending (altering impulse vector rather than canned anim)
	UFUNCTION(BlueprintCallable, Category="Bannon|Grapple")
	void ApplyPhysicsReversal(class ACharacter* Grappler, FVector CurrentImpulse);
};
