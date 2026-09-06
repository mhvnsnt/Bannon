#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonMidAirGrapple.generated.h"

// Phase 4 #24: Mid-Air Grapple Interceptions
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonMidAirGrapple : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonMidAirGrapple();

    // Detects if a diving opponent can be intercepted based on collision trajectories
    UFUNCTION(BlueprintCallable, Category="Bannon|Grappling")
    bool EvaluateMidAirInterception(AActor* Attacker, AActor* DivingOpponent);

    // Transitions from mid-air collision into a catching slam (e.g., Powerslam, RKO)
    UFUNCTION(BlueprintCallable, Category="Bannon|Grappling")
    void ExecuteCatchingSlam(AActor* Attacker, AActor* DivingOpponent, FName SlamType);

protected:
    virtual void BeginPlay() override;
};
