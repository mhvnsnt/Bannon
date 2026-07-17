// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "PhysicsEngine/PhysicalAnimationComponent.h"
#include "BannonPhysicalAnimation.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonPhysicalAnimation : public UPhysicalAnimationComponent
{
	GENERATED_BODY()

public:
	UBannonPhysicalAnimation();

	// PAC setup for Bannon skeleton
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	void ApplyHitReaction(FName BoneName, FVector StrikeVelocity, float MassRatio);
};
