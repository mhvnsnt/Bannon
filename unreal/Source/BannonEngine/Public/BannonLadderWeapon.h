// Copyright BANNON.
#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "BannonLadderWeapon.generated.h"

UCLASS()
class BANNONENGINE_API ABannonLadderWeapon : public AActor
{
	GENERATED_BODY()
public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite) bool bIsSetUp = false;
    
    UFUNCTION(BlueprintCallable, Category="Bannon|Ladder")
    void ClimbLadder(AActor* Fighter);
};
