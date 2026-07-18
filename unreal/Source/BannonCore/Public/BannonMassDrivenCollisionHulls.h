#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonMassDrivenCollisionHulls.generated.h"

// Phase 1 #3: Mass-Driven Collision Hulls
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonMassDrivenCollisionHulls : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonMassDrivenCollisionHulls();

protected:
    virtual void BeginPlay() override;
};
