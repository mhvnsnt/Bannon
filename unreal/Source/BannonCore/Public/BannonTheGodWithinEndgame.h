#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonTheGodWithinEndgame.generated.h"

// Phase 11 #100: The God Within Endgame
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonTheGodWithinEndgame : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonTheGodWithinEndgame();

protected:
    virtual void BeginPlay() override;
};
