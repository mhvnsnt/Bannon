#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonVolumetricDisplacement.generated.h"

UCLASS(ClassGroup=(BannonFX), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonVolumetricDisplacement : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonVolumetricDisplacement();
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

private:
    float BaseDisplacementRadius;
};
