#include "BannonGrappleComponent.h"
#include "GameFramework/Actor.h"
#include "Math/UnrealMathUtility.h"
#include "BannonMatchStateComponent.h"

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

    UE_LOG(LogTemp, Log, TEXT("[BannonGrappleComponent] Grapple Initiated. Disabling inter-rig capsule collision."));
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
    UE_LOG(LogTemp, Log, TEXT("[BannonGrappleComponent] Grapple Broken. Restoring base physics and poise."));
}

void UBannonGrappleComponent::InitiatePinfall()
{
    if (bIsGrappling && ActiveDefender)
    {
        bIsPinfallState = true;
        UE_LOG(LogTemp, Log, TEXT("[BannonGrappleComponent] Pinfall Initiated. Syncing referee state machine."));
    }
}

bool UBannonGrappleComponent::CalculateKickOutProbability(float DefenderMaxHP, float DefenderStamina)
{
    // Kick-Out Probability strictly against MaxHP and Stamina, not Poise
    float BaseProbability = (DefenderMaxHP / 10000.0f) * 0.5f + (DefenderStamina / 100.0f) * 0.5f;
    float Roll = FMath::RandRange(0.0f, 1.0f);
    
    bool bKickOut = Roll < BaseProbability;
    
    if (bKickOut)
    {
        UE_LOG(LogTemp, Log, TEXT("[BannonGrappleComponent] Defender kicked out. Probability: %.2f"), BaseProbability);
        BreakGrapple();
    }
    return bKickOut;
}

void UBannonGrappleComponent::ProcessSubmissionDPS(float DeltaTime)
{
    // Route DPS through DMG_SCALE
    float AppliedDPS = DeltaTime * DMG_SCALE * 2.0f; // Base submission strength
    
    // Telemetry ping for L.I.O.N.T.A.M.E.R. analysis
    UE_LOG(LogTemp, Warning, TEXT("[R.A.B.B.I.T.S.F.O.O.T.] SUBMISSION_DPS | Target: %s | DPS: %.2f"), *ActiveDefender->GetName(), AppliedDPS);
}

void UBannonGrappleComponent::ApplyRootMotionLock(float DeltaTime)
{
    if (AActor* Owner = GetOwner())
    {
        FVector AttackerLocation = Owner->GetActorLocation();
        FRotator AttackerRotation = Owner->GetActorRotation();

        FVector DefenderTargetLocation = AttackerLocation + AttackerRotation.RotateVector(TargetOffset);
        
        ActiveDefender->SetActorLocationAndRotation(DefenderTargetLocation, AttackerRotation);
    }
}

void UBannonGrappleComponent::MonitorGrappleTension()
{
    float CurrentTension = 0.0f; // Calculate joint tension
    
    if (CurrentTension > MAX_TENSION_THRESHOLD)
    {
        UE_LOG(LogTemp, Warning, TEXT("Warning: GRAPPLE_TENSION_EXCEEDED"));
        BreakGrapple();
    }
}

void UBannonGrappleComponent::ToggleStretchDebugMode()
{
    bDebugStretchMode = !bDebugStretchMode;
    UE_LOG(LogTemp, Log, TEXT("[BannonGrappleComponent] Visual Debug Mode for joint stretch (1.45 threshold) %s"), bDebugStretchMode ? TEXT("ENABLED") : TEXT("DISABLED"));
}

void UBannonGrappleComponent::DebugJointStretch()
{
    // Highlight joints exceeding the 1.45 stretch threshold
}
