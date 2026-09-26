#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonVendingMachineEnvironmentalTraps.generated.h"

// Phase 2 #19: Vending Machine & Environmental Traps
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonVendingMachineEnvironmentalTraps : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonVendingMachineEnvironmentalTraps();

protected:
    virtual void BeginPlay() override;
};
