#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonMatchStateLogic.generated.h"

UCLASS(ClassGroup=(BannonMatch), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonMatchStateLogic : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonMatchStateLogic();
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

    UFUNCTION(BlueprintCallable, Category = "Bannon|MatchState")
    bool ValidatePinAttempt(class USkeletalMeshComponent* DefendingMesh, class UPrimitiveComponent* RingMatCollider);

    UFUNCTION(BlueprintCallable, Category = "Bannon|MatchState")
    void ApplyLocalizedLimbFatigue(FName TargetBone, float DamageForce);

    UFUNCTION(BlueprintCallable, Category = "Bannon|MatchState")
    float GetCurrentLimbFatigue(FName TargetBone) const;

private:
    TMap<FName, float> LimbFatigueArrays;
    
    // Reduces base Poise regeneration speed purely based on physical bone degradation
    void TickPoiseDegradation(float DeltaTime);
};
