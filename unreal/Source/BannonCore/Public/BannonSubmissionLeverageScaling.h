#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonSubmissionLeverageScaling.generated.h"

// Phase 4 #38: Submission Leverage Scaling
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonSubmissionLeverageScaling : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonSubmissionLeverageScaling();

protected:
    virtual void BeginPlay() override;
};
