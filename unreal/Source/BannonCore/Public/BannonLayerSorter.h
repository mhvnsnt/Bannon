#pragma once
#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonLayerSorter.generated.h"

UCLASS()
class BANNONCORE_API UBannonLayerSorter : public UObject {
    GENERATED_BODY()
public:
    UBannonLayerSorter();

    UFUNCTION(BlueprintCallable, Category = "Bannon|Rendering")
    void CalculateDepthStencilMasks(int32 LayerIndex, float& OutDepthOffset, int32& OutStencilValue);

    UFUNCTION(BlueprintCallable, Category = "Bannon|Physics")
    void GenerateJoltProxyConstraints(int32 LayerIndex, class USkeletalMeshComponent* InnerMesh, class USkeletalMeshComponent* OuterMesh);
};
