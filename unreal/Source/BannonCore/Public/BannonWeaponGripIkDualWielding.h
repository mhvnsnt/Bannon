#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonWeaponGripIkDualWielding.generated.h"

// Phase 2 #14: Weapon Grip IK & Dual Wielding
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonWeaponGripIkDualWielding : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonWeaponGripIkDualWielding();

protected:
    virtual void BeginPlay() override;
};
