#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonMultiManSubmissionStacking.generated.h"

// Phase 4 #35: Multi-Man Submission Stacking
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonMultiManSubmissionStacking : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonMultiManSubmissionStacking();

protected:
    virtual void BeginPlay() override;
};
