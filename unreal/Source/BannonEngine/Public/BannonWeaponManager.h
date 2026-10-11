// Copyright BANNON.
#pragma once
#include "CoreMinimal.h"
#include "BannonWeaponManager.generated.h"

UCLASS()
class BANNONENGINE_API ABannonWeaponManager : public AActor
{
	GENERATED_BODY()
public:
	UFUNCTION(BlueprintCallable, Category="Bannon|Weapon") 
	void InteractWithWeapon(AActor* WeaponActor);
    
    UPROPERTY(BlueprintReadOnly, Category="Bannon|Weapon")
    bool bIsHoldingWeapon = false;
};
