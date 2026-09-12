#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonFatiguePostureDeformation.generated.h"

// Phase 8 #77: Fatigue Posture Deformation
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonFatiguePostureDeformation : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonFatiguePostureDeformation();

protected:
    virtual void BeginPlay() override;
};
