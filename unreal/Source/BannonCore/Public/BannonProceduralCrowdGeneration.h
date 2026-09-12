#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "Components/InstancedStaticMeshComponent.h"
#include "BannonProceduralCrowdGeneration.generated.h"

// Spatial Partitioning node
struct FCrowdSectorNode {
    FBox Bounds;
    TArray<FTransform> InstanceTransforms;
    UInstancedStaticMeshComponent* ISMC;
};

// Phase 10 #90: Procedural Crowd Generation with Spatial Partitioning
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonProceduralCrowdGeneration : public UActorComponent {
    GENERATED_BODY()
public:    
    UBannonProceduralCrowdGeneration();

    UFUNCTION(BlueprintCallable, Category = "Crowd")
    void BuildInstancedCrowdSector(FBox SectorBounds, UStaticMesh* BaseMesh);

    UFUNCTION(BlueprintCallable, Category = "Crowd")
    void UpdateSpatialPartitioning();

protected:
    virtual void BeginPlay() override;

private:
    TArray<FCrowdSectorNode> SpatialGrid;
};
