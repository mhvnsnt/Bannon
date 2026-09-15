#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonTagTeamChemistryEngine.generated.h"

// Phase 5 #49: Tag Team Chemistry Engine
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonTagTeamChemistryEngine : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonTagTeamChemistryEngine();

protected:
    virtual void BeginPlay() override;
};
