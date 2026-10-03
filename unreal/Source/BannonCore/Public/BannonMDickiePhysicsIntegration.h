#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonMDickieMoves.h"
#include "BannonMDickiePhysicsIntegration.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonMDickiePhysicsIntegration : public UActorComponent
{
    GENERATED_BODY()
public:    
    UBannonMDickiePhysicsIntegration();

    UFUNCTION(BlueprintCallable, Category="Bannon|MDickie")
    void BindMDickieMoveToChaos(FString MDickieMoveName, AActor* TargetActor);
};
