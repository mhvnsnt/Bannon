#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonMassDrivenCollisionHulls.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonMassDrivenCollisionHulls : public UActorComponent
{
    GENERATED_BODY()
public:    
    UBannonMassDrivenCollisionHulls();

    UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
    float CalculateStrikeImpactForce(float AttackerMass, float DefenderMass, FVector LimbVelocity);
};
