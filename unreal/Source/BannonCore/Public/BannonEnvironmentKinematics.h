#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonEnvironmentKinematics.generated.h"

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonEnvironmentKinematics : public UActorComponent
{
    GENERATED_BODY()

public:
    UBannonEnvironmentKinematics();

protected:
    virtual void BeginPlay() override;

public:
    UFUNCTION(BlueprintCallable, Category = "Bannon|Environment")
    void ProcessRopeCollision(AActor* TargetActor, FVector IncomingVelocity, float KineticMass);

    UFUNCTION(BlueprintCallable, Category = "Bannon|Environment")
    void ProcessTurnbuckleImpact(AActor* TargetActor, FVector IncomingVelocity, float KineticMass);

private:
    const float MAX_BODY_VEL = 3.8f;
    const float DMG_SCALE = 8.0f;
    const float ELASTICITY_COEFFICIENT = 0.8f;

    void TriggerRopeShakeAnimation(float ExcessForce);
    void LogTensionTelemetry(float Tension, FVector RecoilVector);
};
