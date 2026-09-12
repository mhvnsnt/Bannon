#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonSubwayTrainInteractivity.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonSubwayTrainInteractivity : public UActorComponent
{
    GENERATED_BODY()
public:    
    UBannonSubwayTrainInteractivity();

    UFUNCTION(BlueprintCallable, Category="Bannon|Sandbox")
    void ApplyInertialPhysicsToFighters(TArray<AActor*> Occupants, FVector TrainVelocity);
};
