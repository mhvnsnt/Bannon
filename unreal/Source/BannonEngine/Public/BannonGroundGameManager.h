// Copyright BANNON.
#pragma once
#include "CoreMinimal.h"
#include "BannonGroundGameManager.generated.h"

UENUM(BlueprintType)
enum class EGroundPosition : uint8 { Guard, HalfGuard, SideControl, Mount };

UCLASS()
class BANNONENGINE_API UBannonGroundGameManager : public UObject
{
	GENERATED_BODY()
public:
	UFUNCTION(BlueprintCallable, Category="Bannon|Ground") 
	void TransitionPosition(AActor* Fighter, EGroundPosition NewPosition);
};
