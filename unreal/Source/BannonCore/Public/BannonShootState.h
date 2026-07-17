#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonShootState.generated.h"

UCLASS()
class BANNONCORE_API UBannonShootState : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category = "Bannon|Physics")
    void TriggerShootState(class USkeletalMeshComponent* WrestlerMesh);

    UFUNCTION(BlueprintCallable, Category = "Bannon|Physics")
    void SetJointCompliance(class USkeletalMeshComponent* WrestlerMesh, float ComplianceLevel); // 0.0 for dead weight
    
    UFUNCTION(BlueprintCallable, Category = "Bannon|Physics")
    bool EvaluateSandbagProbability(float Morale, float BossApproval);
};
