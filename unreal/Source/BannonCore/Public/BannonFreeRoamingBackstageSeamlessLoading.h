#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonFreeRoamingBackstageSeamlessLoading.generated.h"

// Phase 2 #11: Free-Roaming Backstage Seamless Loading
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonFreeRoamingBackstageSeamlessLoading : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonFreeRoamingBackstageSeamlessLoading();

protected:
    virtual void BeginPlay() override;
};
