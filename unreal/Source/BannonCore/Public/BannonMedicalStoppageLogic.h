#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonMedicalStoppageLogic.generated.h"

// Phase 8 #76: Medical Stoppage Logic
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonMedicalStoppageLogic : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonMedicalStoppageLogic();

protected:
    virtual void BeginPlay() override;
};
