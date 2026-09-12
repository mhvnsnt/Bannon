#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonRefBumpingDistractionLogic.generated.h"

// Phase 6 #50: Ref Bumping & Distraction Logic
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonRefBumpingDistractionLogic : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonRefBumpingDistractionLogic();

protected:
    virtual void BeginPlay() override;
};
