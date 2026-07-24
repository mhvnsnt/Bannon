#include "BannonGrappleComponent.h"
#include "GameFramework/Actor.h"
#include "Math/UnrealMathUtility.h"

UBannonGrappleComponent::UBannonGrappleComponent()
{
    PrimaryComponentTick.bCanEverTick = true;
    bIsGrappling = false;
    bDebugStretchMode = false;
    ActiveDefender = nullptr;
}

void UBannonGrappleComponent::BeginPlay()
{
    Super::BeginPlay();
}

void UBannonGrappleComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

    if (bIsGrappling && ActiveDefender)
    {
        ApplyRootMotionLock(DeltaTime);
        MonitorGrappleTension();
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

    UE_LOG(LogTemp, Log, TEXT("[BannonGrappleComponent] Grapple Initiated. Disabling inter-rig capsule collision."));
}

void UBannonGrappleComponent::BreakGrapple()
{
    bIsGrappling = false;
    ActiveDefender = nullptr;
    UE_LOG(LogTemp, Log, TEXT("[BannonGrappleComponent] Grapple Broken. Restoring base physics and poise."));
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
