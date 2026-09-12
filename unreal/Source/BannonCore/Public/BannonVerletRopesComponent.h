#pragma once
#include "CoreMinimal.h"
#include "Components/PrimitiveComponent.h"
#include "BannonVerletRopesComponent.generated.h"

UCLASS(ClassGroup=(BannonPhysics), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonVerletRopesComponent : public UPrimitiveComponent {
    GENERATED_BODY()
public:
    UBannonVerletRopesComponent();
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

    UFUNCTION(BlueprintCallable, Category = "Bannon|Physics")
    void RegisterBodyCollision(FVector ImpactLocation, FVector ImpactVelocity, float BodyMass);

private:
    float BaseTension;
    float SnapbackDamping;

    // Localized array representing physical rope segments
    void UpdateSpringDamperPhysics(float DeltaTime);
};
