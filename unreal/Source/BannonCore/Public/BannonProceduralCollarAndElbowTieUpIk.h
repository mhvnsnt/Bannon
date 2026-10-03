#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonProceduralCollarAndElbowTieUpIk.generated.h"

// Phase 3 #22: Procedural Collar-and-Elbow Tie-up IK
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonProceduralCollarAndElbowTieUpIk : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonProceduralCollarAndElbowTieUpIk();

protected:
    virtual void BeginPlay() override;
};
