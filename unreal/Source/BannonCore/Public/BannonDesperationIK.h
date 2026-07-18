// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonDesperationIK.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonDesperationIK : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonDesperationIK();

	// Procedural Rope Break Reaches (FBIK desperately stretching to nearest rope spline)
	UFUNCTION(BlueprintCallable, Category="Bannon|Submission")
	void ReachForRopeBreak(class ACharacter* Defender);

	// Desperation Tap-Out Physics (Procedural hand slamming on mat)
	UFUNCTION(BlueprintCallable, Category="Bannon|Submission")
	void TriggerProceduralTapOut(class ACharacter* Defender, float PressureThreshold);
};
