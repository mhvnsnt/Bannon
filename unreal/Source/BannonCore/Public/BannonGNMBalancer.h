#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonGNMBalancer.generated.h"

UCLASS(ClassGroup=(BannonCAW), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonGNMBalancer : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonGNMBalancer();

    UFUNCTION(BlueprintCallable, Category = "Bannon|GNM")
    void IngestNeuralMorphWeights(const TMap<FName, float>& GNMWeights, class USkeletalMeshComponent* TargetMesh);

    UFUNCTION(BlueprintCallable, Category = "Bannon|GNM")
    void ApplyExpressionDrivers(class UBannonMatchStateLogic* MatchLogic, class USkeletalMeshComponent* TargetMesh);
};
