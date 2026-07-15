// Copyright BANNON.
#pragma once
#include "CoreMinimal.h"
#include "BannonTauntManager.generated.h"

USTRUCT(BlueprintType)
struct FBannonBuffs
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere, BlueprintReadWrite) float Strength = 1.0f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) float Speed = 1.0f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) float Momentum = 1.0f;
};

UCLASS()
class BANNONENGINE_API UBannonTauntManager : public UObject
{
	GENERATED_BODY()
public:
	UFUNCTION(BlueprintCallable, Category="Bannon|Taunt") 
	FBannonBuffs ExecuteTaunt(FName TauntID);
};
