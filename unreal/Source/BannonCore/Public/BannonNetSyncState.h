#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonNetSyncState.generated.h"

UCLASS()
class BANNONCORE_API UBannonNetSyncState : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Netcode")
    void PackRagdollStateForNetwork(const TArray<FVector>& AllBoneTransforms, UPARAM(ref) TArray<FVector>& OutCompressedNetworkBones);
};
