#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonJointDislocation.generated.h"

// Phase 5 #37: Joint Dislocation Events
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonJointDislocation : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonJointDislocation();

    // Evaluates torque applied during a submission and triggers dislocation if threshold is exceeded
    UFUNCTION(BlueprintCallable, Category="Bannon|Submissions")
    void EvaluateConstraintLimit(FName JointName, float CurrentTorque, float BreakingThreshold);

    // Applies permanent limb penalty to the character
    UFUNCTION(BlueprintCallable, Category="Bannon|Medical")
    void ApplyPermanentLimbPenalty(FName JointName);

protected:
    virtual void BeginPlay() override;

private:
    TArray<FName> DislocatedJoints;
};
