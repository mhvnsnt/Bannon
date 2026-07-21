#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonSpringboardEngine.generated.h"

UCLASS(ClassGroup=(BannonPhysics), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonSpringboardEngine : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonSpringboardEngine();

    UFUNCTION(BlueprintCallable, Category = "Bannon|Physics")
    void EvaluateRopeIntersection(class UBannonVerletRopesComponent* RopeSystem, FVector CapsuleVelocity);
};
