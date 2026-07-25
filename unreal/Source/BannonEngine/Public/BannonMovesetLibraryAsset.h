// Copyright BANNON.
#pragma once
#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "BannonMovesetLibraryAsset.generated.h"

UCLASS(BlueprintType)
class BANNONENGINE_API UMovesetLibraryAsset : public UPrimaryDataAsset
{
    GENERATED_BODY()
public:
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FName MoveID;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FName PositionGroup;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FName MoveClass;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TSoftObjectPtr<UAnimMontage> MoveMontage;
    
    // 2K26 Upgrade Fields
    UPROPERTY(EditAnywhere, BlueprintReadOnly) float StunContribution;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) bool bIsChainWrestlingTrigger;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FName DamageType; // e.g. Impact, Submission, Grapple
    UPROPERTY(EditAnywhere, BlueprintReadOnly) float StaminaCost;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) int32 RequiredTechnicalSkill;
};
