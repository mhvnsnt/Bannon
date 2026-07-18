#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonRibFracturesBreathingAnimation.generated.h"

// Phase 8 #74: Rib Fractures & Breathing Animation
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonRibFracturesBreathingAnimation : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonRibFracturesBreathingAnimation();

protected:
    virtual void BeginPlay() override;
};
