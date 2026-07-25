#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonClothTearing.generated.h"

// Phase 10 #82: Cloth Tearing & Simulation
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonClothTearing : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonClothTearing();

    // Attire that stretches and tears based on physics constraints tearing
    UFUNCTION(BlueprintCallable, Category="Bannon|Rendering")
    void EvaluateClothStress(FName ClothSection, float CurrentTension, float TearThreshold);

protected:
    virtual void BeginPlay() override;

private:
    TArray<FName> TornSections;
};
