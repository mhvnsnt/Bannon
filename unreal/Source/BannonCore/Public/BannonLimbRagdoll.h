#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonLimbRagdoll.generated.h"

// Phase 2 #10: Limb-Specific Ragdoll Triggers
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonLimbRagdoll : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonLimbRagdoll();

    // Trigger localized ragdoll for a specific limb (e.g., dead leg, injured arm)
    UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
    void TriggerLimpState(FName BoneName, float Duration);

    // Attempts to maintain balance while a limb is limp
    UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
    void UpdateBalanceCompensation();

protected:
    virtual void BeginPlay() override;

private:
    FName ActiveLimpBone;
    bool bIsLimbLimp;
};
