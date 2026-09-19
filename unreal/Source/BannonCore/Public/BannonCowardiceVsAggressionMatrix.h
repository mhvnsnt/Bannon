#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonCowardiceVsAggressionMatrix.generated.h"

// Phase 7 #62: Cowardice vs. Aggression Matrix
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonCowardiceVsAggressionMatrix : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonCowardiceVsAggressionMatrix();

protected:
    virtual void BeginPlay() override;
};
