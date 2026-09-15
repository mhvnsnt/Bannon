#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonMultiBodyPileup.generated.h"

// Phase 2 #8: Handle 3+ bodies colliding simultaneously without clipping, stacking masses correctly.
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonMultiBodyPileup : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonMultiBodyPileup();

    // Stacks mass correctly for multi-body pile-ups
    UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
    void CalculateStackedMass(TArray<AActor*> StackedBodies);

    // Prevents clipping during multi-actor collisions
    UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
    void ResolveClippingConstraints(AActor* PrimaryBody, AActor* SecondaryBody);

protected:
    virtual void BeginPlay() override;

private:
    float CumulativeMass;
};
