#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonSubmissionDefenseAi.generated.h"

// Phase 8 #70: Submission Defense AI
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonSubmissionDefenseAi : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonSubmissionDefenseAi();

protected:
    virtual void BeginPlay() override;
};
