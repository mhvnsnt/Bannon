#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonDynamicBruisingShader.generated.h"

// Phase 8 #71: Dynamic Bruising Shader
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonDynamicBruisingShader : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonDynamicBruisingShader();

protected:
    virtual void BeginPlay() override;
};
