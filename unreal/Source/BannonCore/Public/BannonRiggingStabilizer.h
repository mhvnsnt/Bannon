#pragma once
#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonRiggingStabilizer.generated.h"

UCLASS(BlueprintType)
class BANNONCORE_API UBannonRiggingStabilizer : public UObject {
    GENERATED_BODY()
public:
    UBannonRiggingStabilizer();

    // AGENTS.md: Implement Anatomical Weight Clamps to permanently fix hips widen/displacement.
    UFUNCTION(BlueprintCallable, Category = "Bannon|Rigging")
    static void ApplyAnatomicalWeightClamps(class USkeletalMeshComponent* MeshComp);

    // AGENTS.md: Sharper falloff, smooth passes cut to 3, weak-influence pruning.
    UFUNCTION(BlueprintCallable, Category = "Bannon|Rigging")
    static void PruneWeakInfluences(class USkeletalMeshComponent* MeshComp, float Threshold = 0.05f, int32 MaxSmoothPasses = 3);
};
