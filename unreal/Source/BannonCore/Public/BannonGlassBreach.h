#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonGlassBreach.generated.h"

// Phase 7 #56: Backstage Door & Window Breaches
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonGlassBreach : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonGlassBreach();

    // Handles throwing opponents through glass, generating procedural shards and laceration damage
    UFUNCTION(BlueprintCallable, Category="Bannon|Environment")
    void TriggerGlassBreach(AActor* Victim, FVector ImpactVelocity);

protected:
    virtual void BeginPlay() override;

private:
    void ApplyLacerationDamage(AActor* Victim, float ShardSeverity);
};
