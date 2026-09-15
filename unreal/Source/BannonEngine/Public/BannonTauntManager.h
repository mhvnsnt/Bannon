// Copyright BANNON.
#pragma once
#include "CoreMinimal.h"
#include "BannonTauntManager.generated.h"

UCLASS()
class BANNONENGINE_API UBannonTauntManager : public UObject
{
	GENERATED_BODY()
public:
	UFUNCTION(BlueprintCallable, Category="Bannon|Taunt") 
	void ExecuteTaunt(AActor* Fighter, FName TauntID);
};
