#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonDumpsterObjectContainment.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonDumpsterObjectContainment : public UActorComponent
{
    GENERATED_BODY()
public:    
    UBannonDumpsterObjectContainment();

    UFUNCTION(BlueprintCallable, Category="Bannon|Sandbox")
    void CalculateContainmentPhysics(AActor* Dumpster, AActor* ThrownFighter);
};
