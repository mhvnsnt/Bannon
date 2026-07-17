// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonFBIKComponent.generated.h"

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
};
