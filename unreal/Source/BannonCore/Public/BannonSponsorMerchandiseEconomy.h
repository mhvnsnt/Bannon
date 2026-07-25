#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonSponsorMerchandiseEconomy.generated.h"

// Phase 5 #48: Sponsor & Merchandise Economy
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonSponsorMerchandiseEconomy : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonSponsorMerchandiseEconomy();

protected:
    virtual void BeginPlay() override;
};
