// Copyright BANNON.
#pragma once
#include "CoreMinimal.h"
#include "BannonInjuryManager.generated.h"

UCLASS()
class BANNONENGINE_API UBannonInjuryManager : public UObject
{
	GENERATED_BODY()
public:
	UFUNCTION(BlueprintCallable, Category="Bannon|Injury") 
	void RegisterInjury(AActor* Fighter, FName BodyPart, float Severity);
};
