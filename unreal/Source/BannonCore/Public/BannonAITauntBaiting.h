#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonAITauntBaiting.generated.h"

// Phase 8 #69: Taunt & Momentum Baiting AI
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonAITauntBaiting : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonAITauntBaiting();

    // AI evaluates if the opponent is frustrated and safely out of strike range
    UFUNCTION(BlueprintCallable, Category="Bannon|AI")
    bool ShouldBaitOpponent(AActor* Target, float DistanceToTarget);

    // Triggers a taunt to build momentum while observing the opponent's reaction
    UFUNCTION(BlueprintCallable, Category="Bannon|AI")
    void ExecuteMomentumTaunt();

protected:
    virtual void BeginPlay() override;

private:
    float SafetyMargin; // Minimum distance to safely taunt
};
