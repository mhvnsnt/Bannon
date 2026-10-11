// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonTieUpConstraint.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonTieUpConstraint : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonTieUpConstraint();

	// Procedural Collar-and-Elbow Tie-up IK calculation
	UFUNCTION(BlueprintCallable, Category="Bannon|Grapple")
	void EstablishCollarAndElbow(class ACharacter* Attacker, class ACharacter* Defender);

	// Weight Detection Lifting Logic (fails if opponent is too heavy)
	UFUNCTION(BlueprintCallable, Category="Bannon|Grapple")
	bool AttemptLift(class ACharacter* Attacker, class ACharacter* Defender);
};
