#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonMuscleBulgeJigglePhysics.generated.h"

// Phase 9 #81: Muscle Bulge / Jiggle Physics
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonMuscleBulgeJigglePhysics : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonMuscleBulgeJigglePhysics();

protected:
    virtual void BeginPlay() override;
};
