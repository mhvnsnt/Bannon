#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonDumpsterObjectContainment.generated.h"

// Phase 7 #60: Dumpster & Object Containment
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonDumpsterObjectContainment : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonDumpsterObjectContainment();

protected:
    virtual void BeginPlay() override;
};
