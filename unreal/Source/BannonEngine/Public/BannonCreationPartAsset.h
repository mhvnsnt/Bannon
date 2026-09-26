// Copyright BANNON.
#pragma once
#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "BannonCreationPartAsset.generated.h"

USTRUCT(BlueprintType)
struct FPartLayerParams
{
    GENERATED_BODY()
    UPROPERTY(EditAnywhere, BlueprintReadWrite) FVector Offset;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) FRotator Rotation;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) float Scale;
};

UCLASS(BlueprintType)
class BANNONENGINE_API UCreationPartAsset : public UPrimaryDataAsset
{
    GENERATED_BODY()
public:
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FName ItemID;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TSoftObjectPtr<USkeletalMesh> PartMesh;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) bool bAllowsLayering;
    UPROPERTY(EditAnywhere, BlueprintReadOnly, meta=(EditCondition="bAllowsLayering")) int32 MaxLayerCount;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FPartLayerParams> DefaultLayerOverrides;
};
