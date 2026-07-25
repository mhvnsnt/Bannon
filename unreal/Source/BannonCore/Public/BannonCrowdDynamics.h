#pragma once
#include "CoreMinimal.h"
#include "Components/AudioComponent.h"
#include "BannonCrowdDynamics.generated.h"

UCLASS(ClassGroup=(BannonAudio), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonCrowdDynamics : public UAudioComponent {
    GENERATED_BODY()
public:
    UBannonCrowdDynamics();
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

    UFUNCTION(BlueprintCallable, Category = "Bannon|Crowd")
    void InjectPhysicsMomentum(float JoltImpactForce, float CurrentPoise);

private:
    float TargetCrowdIntensity;
    float CurrentCrowdIntensity;
    float MaxPoiseThreshold;
};
