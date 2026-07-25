#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonRopePhysicsSimulationVerlet.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonRopePhysicsSimulationVerlet : public UActorComponent
{
    GENERATED_BODY()
public:    
    UBannonRopePhysicsSimulationVerlet();

    UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
    void CalculateRopeTension(float BodyMass, float ImpactVelocity);

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
    float RopeSnapBackForceMultiplier;
};
