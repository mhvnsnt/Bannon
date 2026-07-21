#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonRollbackInterface.h"
#include "BannonCombatAnimator.generated.h"

UCLASS(ClassGroup=(BannonCombat), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonCombatAnimator : public UActorComponent, public IBannonRollbackInterface {
    GENERATED_BODY()
public:
    UBannonCombatAnimator();
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

    UFUNCTION(BlueprintCallable, Category="Bannon|Combat")
    void ApplyHitStop(int32 Frames, float DilationScale);

    UFUNCTION(BlueprintCallable, Category="Bannon|Combat")
    void ProcessActiveRagdoll(FName HitBone, float ImpactForce);

    UFUNCTION(BlueprintCallable, Category="Bannon|Combat")
    void TriggerPoiseCrumple();

    // Rollback Interface
    virtual void SerializeState(TArray<uint8>& OutBuffer) override;
    virtual void DeserializeState(const TArray<uint8>& InBuffer) override;
    virtual void SnapToFrame(float AnimSequenceTime, float CurrentBlendWeight) override;

private:
    float CurrentBlendWeight;
    float HitStopTimeDilation;
    int32 HitStopFramesRemaining;
    bool bIsCrumpled;
};
