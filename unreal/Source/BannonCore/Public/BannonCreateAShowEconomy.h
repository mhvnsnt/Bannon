#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonCreateAShowEconomy.generated.h"

// Phase 10 #96: Create-A-Show Economy
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonCreateAShowEconomy : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonCreateAShowEconomy();

protected:
    virtual void BeginPlay() override;
};
