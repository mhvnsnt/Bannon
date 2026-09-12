// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Volume.h"
#include "BannonHazardVolume.generated.h"

UCLASS(ClassGroup=(Bannon))
class BANNONCORE_API ABannonHazardVolume : public AVolume
{
	GENERATED_BODY()

public:
	ABannonHazardVolume();

	// E.g. Electrical Panels, Subway Trains, Traffic
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Hazard")
	FName HazardType;

	UFUNCTION(BlueprintCallable, Category="Bannon|Hazard")
	void TriggerHazard(class ACharacter* Victim);
};
