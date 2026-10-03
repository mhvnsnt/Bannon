#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonCrowdHeatMemory.generated.h"

// Phase 6 #47: Crowd Heat Memory
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonCrowdHeatMemory : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonCrowdHeatMemory();

    // The audience remembers betrayals or heroics across multiple arena instances
    UFUNCTION(BlueprintCallable, Category="Bannon|Crowd")
    void RecordHeatEvent(FName EventType, float Magnitude);

    // Apply lingering heat to the crowd's baseline reaction at the start of a match
    UFUNCTION(BlueprintCallable, Category="Bannon|Crowd")
    float CalculateBaselineHeat(FName FighterID, FName ArenaID);

protected:
    virtual void BeginPlay() override;

private:
    // Tracks accumulated heat over time
    TMap<FName, float> HistoricalHeatMatrix;
};
