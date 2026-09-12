// Copyright BANNON.
#pragma once
#include "CoreMinimal.h"
#include "BannonFighterCharacter.h"
#include "BannonPromotionManager.generated.h"

UCLASS()
class BANNONENGINE_API ABannonPromotionManager : public AActor
{
	GENERATED_BODY()
public:
	UFUNCTION(BlueprintCallable, Category="Bannon|Promotion") 
	void BookMatch(ABannonFighterCharacter* F1, ABannonFighterCharacter* F2, FName MatchType);
};
