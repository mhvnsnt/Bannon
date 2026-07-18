#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonGodWithinGAS.generated.h"

// Exclusively for God Within Mode - Manages RPG elements and the Ontological Tree of Life via GAS
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonGodWithinGAS : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonGodWithinGAS();

    // Ontological Tree of Life - Cosmic Alignment score (0-100)
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "GodWithin|Ontology")
    float CosmicAlignment;
    
    // Mental Alignment score (0-100)
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "GodWithin|Ontology")
    float MentalAlignment;

    UFUNCTION(BlueprintCallable, Category = "GodWithin|Abilities")
    void GrantOntologicalBuff(FName BuffName);

    UFUNCTION(BlueprintCallable, Category = "GodWithin|Progression")
    void EvaluateTreeOfLifeProgression(float MatchPerformanceScore, float CosmicShift);

protected:
    virtual void BeginPlay() override;

private:
    void InitializeAbilitySystem();
    bool bIsGASInitialized;
};
