#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonSubmissionReversalTransitions.generated.h"

// Phase 4 #33: Submission Reversal Transitions
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonSubmissionReversalTransitions : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonSubmissionReversalTransitions();

protected:
    virtual void BeginPlay() override;
};
