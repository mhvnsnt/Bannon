#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonPromoInterviewEngine.generated.h"

// Phase 10 #94: Promo/Interview Engine
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonPromoInterviewEngine : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonPromoInterviewEngine();

protected:
    virtual void BeginPlay() override;
};
