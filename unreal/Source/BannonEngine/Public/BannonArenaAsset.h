// Copyright BANNON.
#pragma once
#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "BannonArenaAsset.generated.h"

UCLASS(BlueprintType)
class BANNONENGINE_API UBannonArenaAsset : public UPrimaryDataAsset
{
    GENERATED_BODY()
public:
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FName ArenaID;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TSoftObjectPtr<UStaticMesh> BarricadeMesh;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TSoftObjectPtr<UStaticMesh> RampMesh;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TSoftObjectPtr<UMaterialInterface> TronMaterial;
};
