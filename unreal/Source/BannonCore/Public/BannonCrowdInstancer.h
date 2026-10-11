#pragma once
#include "CoreMinimal.h"
#include "Components/HierarchicalInstancedStaticMeshComponent.h"
#include "BannonCrowdInstancer.generated.h"

UCLASS(ClassGroup=(BannonRendering), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonCrowdInstancer : public UHierarchicalInstancedStaticMeshComponent {
    GENERATED_BODY()
public:
    UBannonCrowdInstancer();
    
    UFUNCTION(BlueprintCallable, Category = "Bannon|Crowd")
    void PopulateArenaBlock(const TArray<FTransform>& SeatTransforms);

    UFUNCTION(BlueprintCallable, Category = "Bannon|Crowd")
    void UpdateCrowdShaderIntensity(float CurrentIntensity);
};
