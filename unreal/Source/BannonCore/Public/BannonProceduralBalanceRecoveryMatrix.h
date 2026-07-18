#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonProceduralBalanceRecoveryMatrix.generated.h"

// Phase 1 #1: Procedural Balance Recovery Matrix
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonProceduralBalanceRecoveryMatrix : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonProceduralBalanceRecoveryMatrix();

protected:
    virtual void BeginPlay() override;
};
