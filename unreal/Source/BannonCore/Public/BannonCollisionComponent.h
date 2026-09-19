#pragma once

#include "CoreMinimal.h"
#include "Components/PrimitiveComponent.h"
#include "BannonCollisionComponent.generated.h"

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonCollisionComponent : public UPrimitiveComponent
{
    GENERATED_BODY()

public:
    UBannonCollisionComponent();

protected:
    virtual void BeginPlay() override;

public:
    UFUNCTION(BlueprintCallable, Category = "Bannon|KineticCollision")
    void ProcessBoneImpact(FName HitBone, FVector ImpactLocation, FVector ImpactVelocity, float KineticMass);

private:
    const float DMG_SCALE = 8.0f;
    const float MAX_BODY_VEL = 3.8f;
    const float MAX_HP = 10000.0f;

    void LogImpactTelemetry(FName Bone, FVector Location, float Force, float PoiseDelta);
};
