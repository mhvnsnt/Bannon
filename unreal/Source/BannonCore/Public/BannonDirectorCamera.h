#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonDirectorCamera.generated.h"

UCLASS(ClassGroup=(BannonCamera), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonDirectorCamera : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonDirectorCamera();
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

    UFUNCTION(BlueprintCallable, Category = "Bannon|Camera")
    void TriggerImpactPunchIn(float ImpactForce);

private:
    void UpdateMidpointTracking(float DeltaTime);
    float BaseFOV;
    float CurrentFOVOffset;
};
