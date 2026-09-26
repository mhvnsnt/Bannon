// Copyright BANNON.

#include "BannonALSMovementComponent.h"

UBannonALSMovementComponent::UBannonALSMovementComponent()
{
    HeavyImpactThreshold = 1000.0f;
    bIsInActiveRagdoll = false;
    WarpingState.bIsSpeedWarping = false;
    WarpingState.bIsDirectionWarping = false;
    WarpingState.CurrentWarpAngle = 0.0f;
    WarpingState.SpeedWarpMultiplier = 1.0f;
    WarpingState.ProceduralVelocityVector = FVector::ZeroVector;
}

void UBannonALSMovementComponent::SetLocomotionState(FName NewState)
{
    if (NewState == "Idle") LocomotionState = EBannonLocomotionState::Idle;
    else if (NewState == "Walk") LocomotionState = EBannonLocomotionState::Walk;
    else if (NewState == "Run") LocomotionState = EBannonLocomotionState::Run;
    else if (NewState == "Strafe") LocomotionState = EBannonLocomotionState::Strafe;
    else if (NewState == "Pivot") LocomotionState = EBannonLocomotionState::Pivot;
    else if (NewState == "Airborne") LocomotionState = EBannonLocomotionState::Airborne;
    else if (NewState == "Ragdoll") LocomotionState = EBannonLocomotionState::Ragdoll;
    else
    {
        UE_LOG(LogTemp, Warning, TEXT("Bannon ALS-R: UNKNOWN locomotion state '%s' — not PASS."), *NewState.ToString());
        return;
    }

    UE_LOG(LogTemp, Log, TEXT("Bannon ALS-R: locomotion state=%s"), *NewState.ToString());
}

void UBannonALSMovementComponent::TriggerGetUpAnimation()
{
    if (bIsInActiveRagdoll)
    {
        bIsInActiveRagdoll = false;
        SetLocomotionState("Idle");
        UE_LOG(LogTemp, Log, TEXT("Bannon ALS-R: active ragdoll -> get-up -> Idle transition."));
    }
}

void UBannonALSMovementComponent::CalculateWarpingStates(float DeltaTime, const FVector& InputDirection, const FVector& ActualVelocity)
{
    if (bIsInActiveRagdoll)
    {
        WarpingState.bIsSpeedWarping = false;
        WarpingState.bIsDirectionWarping = false;
        WarpingState.SpeedWarpMultiplier = 1.0f;
        WarpingState.CurrentWarpAngle = 0.0f;
        SpeedErrorRatio = 0.0f;
        return;
    }

    const float CurrentSpeed = ActualVelocity.Size2D();
    const float MaxExpectedSpeed = FMath::Max(1.0f, MaxWalkSpeed);
    WarpingState.ProceduralVelocityVector = ActualVelocity;

    SpeedErrorRatio = FMath::Abs(CurrentSpeed - MaxExpectedSpeed) / MaxExpectedSpeed;

    if (CurrentSpeed <= 5.0f)
    {
        SetLocomotionState("Idle");
        WarpingState.bIsSpeedWarping = false;
        WarpingState.bIsDirectionWarping = false;
        WarpingState.SpeedWarpMultiplier = 1.0f;
        WarpingState.CurrentWarpAngle = 0.0f;
        return;
    }

    const FVector NormalizedVelocity = ActualVelocity.GetSafeNormal2D();
    const FVector NormalizedInput = InputDirection.GetSafeNormal2D();

    if (InputDirection.Size2D() <= 0.1f || NormalizedVelocity.IsNearlyZero())
    {
        UE_LOG(LogTemp, Warning, TEXT("Bannon ALS-R: UNKNOWN locomotion direction — not PASS."));
        return;
    }

    const float DotProduct = FVector::DotProduct(NormalizedInput, NormalizedVelocity);
    const float AngleRad = FMath::Acos(FMath::Clamp(DotProduct, -1.0f, 1.0f));
    WarpingState.CurrentWarpAngle = FMath::RadiansToDegrees(AngleRad);
    WarpingState.bIsSpeedWarping = CurrentSpeed > 5.0f;
    WarpingState.bIsDirectionWarping = WarpingState.CurrentWarpAngle > 15.0f;
    WarpingState.SpeedWarpMultiplier = FMath::Clamp(CurrentSpeed / MaxExpectedSpeed, 0.5f, 2.0f);

    const float InputSpeed = InputDirection.Size2D();
    SetLocomotionState(InputSpeed > 0.75f ? "Run" : "Walk");
}

void UBannonALSMovementComponent::TriggerActiveRagdoll(float ImpactVelocity, float MassRatio, const FVector& ImpactVector)
{
    const float CalculatedKineticImpact = ImpactVelocity * MassRatio;

    if (CalculatedKineticImpact >= HeavyImpactThreshold)
    {
        bIsInActiveRagdoll = true;
        SetLocomotionState("Ragdoll");
        DisableMovement();
        UE_LOG(LogTemp, Warning, TEXT("Bannon ALS-R: heavy impact=%f threshold=%f -> Ragdoll."), CalculatedKineticImpact, HeavyImpactThreshold);
    }
    else
    {
        UE_LOG(LogTemp, Log, TEXT("Bannon ALS-R: minor impact=%f; locomotion retained."), CalculatedKineticImpact);
    }
}
