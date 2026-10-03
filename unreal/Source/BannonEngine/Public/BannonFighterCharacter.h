// Copyright BANNON.
#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "BannonTauntManager.h"
#include "BannonPoseAuthorityComponent.h"
#include "BannonFighterCharacter.generated.h"

UCLASS()
class BANNONENGINE_API ABannonFighterCharacter : public ACharacter
{
    GENERATED_BODY()
public:
    ABannonFighterCharacter();

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Bannon|Pose")
    TObjectPtr<UBannonPoseAuthorityComponent> PoseAuthority;

    UPROPERTY() UBannonTauntManager* TauntManager;

    UPROPERTY(BlueprintReadWrite, Category="Bannon|Visual") float HeadCutAlpha;
    UPROPERTY(BlueprintReadWrite, Category="Bannon|Visual") float TorsoBruiseAlpha;
    UFUNCTION(BlueprintCallable, Category="Bannon|Visual") void RefreshDamageMaterials();
    UFUNCTION(BlueprintCallable, Category="Bannon|Taunt") void TriggerTaunt(FName TauntID);
};
