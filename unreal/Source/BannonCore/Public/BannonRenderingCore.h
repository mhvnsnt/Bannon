// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonRenderingCore.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonRenderingCore : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonRenderingCore();

	// Sweat Subsurface Scattering & Specularity
	UFUNCTION(BlueprintCallable, Category="Bannon|Rendering")
	void UpdateSweatAccumulation(float MatchDurationMinutes, float ExertionLevel);

	// Muscle Bulge / Jiggle Physics via KawaiiPhysics / AnimDynamics
	UFUNCTION(BlueprintCallable, Category="Bannon|Rendering")
	void TriggerMuscleFlex(float StrengthOutput);
};
