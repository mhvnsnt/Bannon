// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "BannonALSMovementComponent.generated.h"

UENUM(BlueprintType)
enum class EBannonLocomotionState : uint8
{
    Idle,
    Walk,
    Run,
    Strafe,
    Pivot,
    Airborne,
    Ragdoll
};

USTRUCT(BlueprintType)
struct FBannonALSWarpState
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Locomotion") bool bIsSpeedWarping = false;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Locomotion") bool bIsDirectionWarping = false;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Locomotion") float CurrentWarpAngle = 0.0f;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Locomotion") float SpeedWarpMultiplier = 1.0f;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Locomotion") FVector ProceduralVelocityVector = FVector::ZeroVector;
};

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonALSMovementComponent : public UCharacterMovementComponent
{
    GENERATED_BODY()

public:
    UBannonALSMovementComponent();

    UFUNCTION(BlueprintCallable, Category="Bannon|Locomotion")
    void SetLocomotionState(FName NewState);

    UFUNCTION(BlueprintCallable, Category="Bannon|Locomotion")
    void TriggerGetUpAnimation();

    UFUNCTION(BlueprintCallable, Category="Bannon|Locomotion")
    void CalculateWarpingStates(float DeltaTime, const FVector& InputDirection, const FVector& ActualVelocity);

    UFUNCTION(BlueprintCallable, Category="Bannon|Locomotion")
    void TriggerActiveRagdoll(float ImpactVelocity, float MassRatio, const FVector& ImpactVector);

    UFUNCTION(BlueprintPure, Category="Bannon|Locomotion")
    EBannonLocomotionState GetLocomotionState() const { return LocomotionState; }

    UFUNCTION(BlueprintPure, Category="Bannon|Locomotion")
    float GetDirectionErrorDegrees() const { return WarpingState.CurrentWarpAngle; }

    UFUNCTION(BlueprintPure, Category="Bannon|Locomotion")
    float GetSpeedErrorRatio() const { return SpeedErrorRatio; }

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Locomotion")
    FBannonALSWarpState WarpingState;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Locomotion")
    float HeavyImpactThreshold = 1000.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Locomotion")
    bool bIsInActiveRagdoll = false;

private:
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Bannon|Locomotion", meta=(AllowPrivateAccess="true"))
    EBannonLocomotionState LocomotionState = EBannonLocomotionState::Idle;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Bannon|Locomotion", meta=(AllowPrivateAccess="true"))
    float SpeedErrorRatio = 0.0f;
};
