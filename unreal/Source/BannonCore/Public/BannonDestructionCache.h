#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonDestructionCache.generated.h"

UCLASS()
class BANNONCORE_API UBannonDestructionCache : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Environment")
    void CacheFracturedMesh(const FString& PropID, const TArray<FTransform>& ShardTransforms, UPARAM(ref) TMap<FString, TArray<FTransform>>& LevelDestructionCache);
};
