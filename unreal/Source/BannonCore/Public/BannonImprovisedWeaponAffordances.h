#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonImprovisedWeaponAffordances.generated.h"

// Phase 2 #15: Improvised Weapon Affordances
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonImprovisedWeaponAffordances : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonImprovisedWeaponAffordances();

protected:
    virtual void BeginPlay() override;
};
