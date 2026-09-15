// Copyright BANNON.

#include "BannonGrappleComponent.h"
#include "GameFramework/Actor.h"
#include "Math/UnrealMathUtility.h"
#include "BannonMatchStateComponent.h"
#include "GameFramework/CharacterMovementComponent.h"

UBannonGrappleComponent::UBannonGrappleComponent()
{
    PrimaryComponentTick.bCanEverTick = true;
    bIsGrappling = false;
    bIsPinfallState = false;
    bIsSubmissionState = false;
    bDebugStretchMode = false;
    ActiveDefender = nullptr;
    MatchStateRef = nullptr;
}

void UBannonGrappleComponent::BeginPlay()
{
    Super::BeginPlay();
    MatchStateRef = GetOwner()->FindComponentByClass<UBannonMatchStateComponent>();
}

void UBannonGrappleComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

    if (bIsGrappling && ActiveDefender)
    {
        ApplyRootMotionLock(DeltaTime);
        MonitorGrappleTension();

        if (bIsPinfallState && MatchStateRef)
        {
            MatchStateRef->InitiateRefereeCount(DeltaTime);
        }

        if (bIsSubmissionState)
        {
            ProcessSubmissionDPS(DeltaTime);
        }
    }

    if (bDebugStretchMode)
    {
        DebugJointStretch();
    }
}

void UBannonGrappleComponent::InitiateGrapple(AActor* TargetDefender, FVector OffsetDistance)
{
    if (!TargetDefender) return;

    ActiveDefender = TargetDefender;
    TargetOffset = OffsetDistance;
    bIsGrappling = true;
    bIsPinfallState = false;
    bIsSubmissionState = false;

    UE_LOG(LogTemp, Log, TEXT("[BannonGrappleComponent] Grapple Initiated. Target transform will be constrained by movement authority."));
}

void UBannonGrappleComponent::BreakGrapple()
{
    bIsGrappling = false;
    bIsPinfallState = false;
    bIsSubmissionState = false;
    ActiveDefender = nullptr;
    if (MatchStateRef)
    {
        MatchStateRef->ResetRefereeCount();
    }
    UE_LOG(LogTemp, Log, TEXT("[BannonGrappleComponent] Grapple Broken."));
}

void UBannonGrappleComponent::InitiatePinfall()
{
    if (bIsGrappling && ActiveDefender)
    {
        bIsPinfallState = true;
        UE_LOG(LogTemp, Log, TEXT("[BannonGrappleComponent] Pinfall Initiated."));
    }
}

bool UBannonGrappleComponent::CalculateKickOutProbability(float DefenderMaxHP, float DefenderStamina)
{
    const float BaseProbability = (DefenderMaxHP / 10000.0f) * 0.5f + (DefenderStamina / 100.0f) * 0.5f;
    const float Roll = FMath::RandRange(0.0f, 1.0f);
    const bool bKickOut = Roll < BaseProbability;

    if (bKickOut)
    {
        UE_LOG(LogTemp, Log, TEXT("[BannonGrappleComponent] Defender kicked out. Probability: %.2f"), BaseProbability);
        BreakGrapple();
    }
    return bKickOut;
}

void UBannonGrappleComponent::ProcessSubmissionDPS(float DeltaTime)
{
    const float AppliedDPS = DeltaTime * DMG_SCALE * 2.0f;
    UE_LOG(LogTemp, Warning, TEXT("[R.A.B.B.I.T.S.F.O.O.T.] SUBMISSION_DPS | Target: %s | DPS: %.2f"), *ActiveDefender->GetName(), AppliedDPS);
}

void UBannonGrappleComponent::ApplyRootMotionLock(float DeltaTime)
{
    if (!ActiveDefender || DeltaTime <= 0.0f)
    {
        return;
    }

    // Grapple is an interaction constraint, not a second locomotion system.
    // Do not teleport the defender. The defender's CharacterMovement/pose authority
    // owns capsule motion. We only expose the desired relative target and measure error.
    const AActor* Owner = GetOwner();
    if (!Owner)
    {
        return;
    }

    const FVector DesiredLocation =
        Owner->GetActorLocation() +
        Owner->GetActorRotation().RotateVector(TargetOffset);

    const float PositionErrorCm =
        FVector::Dist(ActiveDefender->GetActorLocation(), DesiredLocation);

    const float RotationErrorDeg =
        FMath::Abs(FMath::FindDeltaAngleDegrees(
            ActiveDefender->GetActorRotation().Yaw,
            Owner->GetActorRotation().Yaw));

    UE_LOG(LogTemp, Verbose,
        TEXT("Bannon Grapple Constraint | PositionErrorCm=%.3f RotationErrorDeg=%.3f"),
        PositionErrorCm, RotationErrorDeg);

    // Hard teleporting here is intentionally forbidden. A future interaction
    // solver must submit a bounded correction through the defender's movement
    // authority instead.
}

void UBannonGrappleComponent::MonitorGrappleTension()
{
    const float CurrentTension = 0.0f;

    if (CurrentTension > MAX_TENSION_THRESHOLD)
    {
        UE_LOG(LogTemp, Warning, TEXT("Warning: GRAPPLE_TENSION_EXCEEDED"));
        BreakGrapple();
    }
}

void UBannonGrappleComponent::ToggleStretchDebugMode()
{
    bDebugStretchMode = !bDebugStretchMode;
    UE_LOG(LogTemp, Log, TEXT("[BannonGrappleComponent] Visual Debug Mode %s"), bDebugStretchMode ? TEXT("ENABLED") : TEXT("DISABLED"));
}

void UBannonGrappleComponent::DebugJointStretch()
{
    // Interaction stretch visualization remains measurement-only until the
    // authoritative interaction solver is wired.
}
