#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonMetahumanFaceRigDamage.generated.h"

// Phase 9 #84: MetaHuman Face Rig Damage
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonMetahumanFaceRigDamage : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonMetahumanFaceRigDamage();

protected:
    virtual void BeginPlay() override;
};
