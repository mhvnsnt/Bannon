// Copyright BANNON.
#pragma once
#include "CoreMinimal.h"
#include "BannonReversalManager.generated.h"

UCLASS()
class BANNONENGINE_API UBannonReversalManager : public UObject
{
	GENERATED_BODY()
public:
	UFUNCTION(BlueprintCallable, Category="Bannon|Reversal") 
	void ExecuteReversal(FName ReversalType); // Breaker, Block, Dodge, MidMove
};
