#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonGlancingBlowCalculations.generated.h"

// Phase 3 #27: Glancing Blow Calculations
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonGlancingBlowCalculations : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonGlancingBlowCalculations();

protected:
    virtual void BeginPlay() override;
};
