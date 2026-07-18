// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonDynamicRope.generated.h"

class UCableComponent;

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonDynamicRope : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonDynamicRope();

	// Calculate and apply tension force against a wrestler's body mass
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	void ApplyRopeTension(class ACharacter* InteractingCharacter, FVector HitLocation);

	// Multiplier for when a wrestler bounces off the ropes
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	FVector CalculateReboundVelocity(FVector IncomingVelocity, float RopeTensionScalar);

protected:
	virtual void BeginPlay() override;

private:
	// Reference to the cable component representing the rope
	UCableComponent* RopeCable;
};
