#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonInteractiveCrowdMechanics.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonInteractiveCrowdMechanics : public UActorComponent
{
    GENERATED_BODY()
public:
    UBannonInteractiveCrowdMechanics();
    
    UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
    void EvaluateBarricadeTrajectory(class ACharacter* ThrownActor, FVector BarricadeLocation);
};
