#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonMoraleDrivenDefections.generated.h"

// Phase 10 #93: Morale-Driven Defections
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonMoraleDrivenDefections : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonMoraleDrivenDefections();

protected:
    virtual void BeginPlay() override;
};
