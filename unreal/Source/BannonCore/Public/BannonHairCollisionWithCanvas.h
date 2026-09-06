#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonHairCollisionWithCanvas.generated.h"

// Phase 9 #83: Hair Collision with Canvas
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonHairCollisionWithCanvas : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonHairCollisionWithCanvas();

protected:
    virtual void BeginPlay() override;
};
