#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonDynamicJointConstraintTearing.generated.h"

// Phase 1 #2: Dynamic Joint Constraint Tearing
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonDynamicJointConstraintTearing : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonDynamicJointConstraintTearing();

protected:
    virtual void BeginPlay() override;
};
