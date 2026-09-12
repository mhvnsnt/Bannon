#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonCrowdWeaponHandOffs.generated.h"

// Phase 6 #59: Crowd Weapon Hand-offs
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonCrowdWeaponHandOffs : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonCrowdWeaponHandOffs();

protected:
    virtual void BeginPlay() override;
};
