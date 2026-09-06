#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonConcussionDazeStateEngine.generated.h"

// Phase 8 #73: Concussion / Daze State Engine
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonConcussionDazeStateEngine : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonConcussionDazeStateEngine();

protected:
    virtual void BeginPlay() override;
};
