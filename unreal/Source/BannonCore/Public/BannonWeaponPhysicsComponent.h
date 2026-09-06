#pragma once
#include "CoreMinimal.h"
#include "Components/StaticMeshComponent.h"
#include "BannonWeaponPhysicsComponent.generated.h"

UCLASS(ClassGroup=(BannonCombat), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonWeaponPhysicsComponent : public UStaticMeshComponent {
    GENERATED_BODY()
public:
    UBannonWeaponPhysicsComponent();

    UFUNCTION(BlueprintCallable, Category = "Bannon|Weapons")
    void RegisterWeaponImpact(class AActor* HitActor, FVector HitVelocity, class UPrimitiveComponent* HitComponent);

private:
    float BaseWeaponMass;
    float HardnessMultiplier;
};
