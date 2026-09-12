#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonLacerationBloodPooling.generated.h"

// Phase 8 #72: Laceration & Blood Pooling
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonLacerationBloodPooling : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonLacerationBloodPooling();

protected:
    virtual void BeginPlay() override;
};
