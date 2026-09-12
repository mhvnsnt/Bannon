#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonWeaponScavengingAi.generated.h"

// Phase 7 #68: Weapon Scavenging AI
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonWeaponScavengingAi : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonWeaponScavengingAi();

protected:
    virtual void BeginPlay() override;
};
