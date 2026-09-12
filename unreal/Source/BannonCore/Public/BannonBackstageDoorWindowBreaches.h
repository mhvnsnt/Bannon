#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonBackstageDoorWindowBreaches.generated.h"

// Phase 6 #56: Backstage Door & Window Breaches
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonBackstageDoorWindowBreaches : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonBackstageDoorWindowBreaches();

protected:
    virtual void BeginPlay() override;
};
