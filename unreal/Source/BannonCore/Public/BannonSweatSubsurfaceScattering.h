#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonSweatSubsurfaceScattering.generated.h"

// Phase 9 #87: Sweat Subsurface Scattering
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonSweatSubsurfaceScattering : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonSweatSubsurfaceScattering();

protected:
    virtual void BeginPlay() override;
};
