#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonOntologicalTreeOfLifeCore.generated.h"

// Phase 5 #41: Ontological Tree of Life Core
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonOntologicalTreeOfLifeCore : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonOntologicalTreeOfLifeCore();

protected:
    virtual void BeginPlay() override;
};
