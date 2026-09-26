// Copyright BANNON.
#pragma once
#include "CoreMinimal.h"
#include "BannonPsychologyParser.generated.h"

UCLASS()
class BANNONENGINE_API UBannonPsychologyParser : public UObject
{
	GENERATED_BODY()
public:
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Psych") float CrowdMomentum = 50.0f;
	UFUNCTION(BlueprintCallable, Category="Bannon|Psych") void UpdateMomentum(float Delta);
};
