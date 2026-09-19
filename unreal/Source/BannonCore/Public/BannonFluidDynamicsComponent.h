#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonFluidDynamicsComponent.generated.h"

UCLASS(ClassGroup=(BannonFX), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonFluidDynamicsComponent : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonFluidDynamicsComponent();

    UFUNCTION(BlueprintCallable, Category = "Bannon|Fluid")
    void EvaluateBloodSplatter(float ImpactForce, float BoneFatigue, FVector SwingVelocity, FVector ImpactLocation);
};
