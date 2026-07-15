// Copyright BANNON.
#pragma once
#include "CoreMinimal.h"
#include "BannonFighterCharacter.generated.h"

UCLASS()
class BANNONENGINE_API ABannonFighterCharacter : public ACharacter
{
	GENERATED_BODY()
public:
    // Visual Damage Rendering Props
    UPROPERTY(BlueprintReadWrite, Category="Bannon|Visual") float HeadCutAlpha = 0.0f;
    UPROPERTY(BlueprintReadWrite, Category="Bannon|Visual") float TorsoBruiseAlpha = 0.0f;
    
    // Impact logic stub
    UFUNCTION(BlueprintCallable, Category="Bannon|Visual") void RefreshDamageMaterials();
};
