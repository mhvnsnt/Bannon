#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonProceduralCityBlockGenerationOverpassApi.generated.h"

// Phase 6 #51: Procedural City Block Generation (Overpass API)
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonProceduralCityBlockGenerationOverpassApi : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonProceduralCityBlockGenerationOverpassApi();

protected:
    virtual void BeginPlay() override;
};
