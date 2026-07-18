#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonSubwayTrainInteractivity.generated.h"

// Phase 2 #18: Subway/Train Interactivity
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonSubwayTrainInteractivity : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonSubwayTrainInteractivity();

protected:
    virtual void BeginPlay() override;
};
