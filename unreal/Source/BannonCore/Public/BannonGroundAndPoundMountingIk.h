#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonGroundAndPoundMountingIk.generated.h"

// Phase 4 #30: Ground-and-Pound Mounting IK
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonGroundAndPoundMountingIk : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonGroundAndPoundMountingIk();

protected:
    virtual void BeginPlay() override;
};
