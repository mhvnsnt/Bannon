#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonTurnbuckleDeformationPhysics.generated.h"

// Phase 1 #6: Turnbuckle Deformation Physics
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonTurnbuckleDeformationPhysics : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonTurnbuckleDeformationPhysics();

protected:
    virtual void BeginPlay() override;
};
