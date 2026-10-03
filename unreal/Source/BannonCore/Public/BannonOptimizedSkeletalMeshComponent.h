#pragma once
#include "CoreMinimal.h"
#include "Components/SkeletalMeshComponent.h"
#include "BannonOptimizedSkeletalMeshComponent.generated.h"

UCLASS(ClassGroup=(BannonRendering), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonOptimizedSkeletalMeshComponent : public USkeletalMeshComponent {
    GENERATED_BODY()
public:
    UBannonOptimizedSkeletalMeshComponent();
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

    UFUNCTION(BlueprintCallable, Category="Bannon|Rendering")
    void UpdateOptimizedBuffers();

    UPROPERTY(EditAnywhere, Category="Bannon|Rendering")
    float LODDistanceThreshold = 2500.0f;

    UPROPERTY(EditAnywhere, Category="Bannon|Rendering")
    bool bEnablePerVertexLOD = true;

private:
    void ApplyContinuousBodySkinning();
    void OptimizeVertexBuffersForDistance();
    void UpdateLiveDamageVisuals(class UBannonMatchStateLogic* MatchLogic);
};
