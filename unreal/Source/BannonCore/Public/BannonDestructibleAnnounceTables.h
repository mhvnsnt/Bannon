#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonDestructibleAnnounceTables.generated.h"

// Phase 6 #54: Destructible Announce Tables
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonDestructibleAnnounceTables : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonDestructibleAnnounceTables();

protected:
    virtual void BeginPlay() override;
};
