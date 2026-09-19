#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonRunInInterferenceLogic.generated.h"

// Phase 10 #99: Run-in & Interference Logic
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonRunInInterferenceLogic : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonRunInInterferenceLogic();

protected:
    virtual void BeginPlay() override;
};
