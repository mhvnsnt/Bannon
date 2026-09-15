#include "BannonAnimInstance.h"
#include "Math/UnrealMathUtility.h"
#include "Async/Async.h"

UBannonAnimInstance::UBannonAnimInstance()
{
    ActivePoise = 100.0f;
    CrumpleBlendWeight = 0.0f;
    IKBlendWeight = 1.0f;
    bIsCrumpled = false;
}

void UBannonAnimInstance::NativeUpdateAnimation(float DeltaSeconds)
{
    Super::NativeUpdateAnimation(DeltaSeconds);

    // Strict Crumple Coupling: Crumple states derive exclusively from active Poise
    if (ActivePoise <= POISE_CRUMPLE_THRESHOLD && !bIsCrumpled)
    {
        bIsCrumpled = true;
    }
    else if (ActivePoise > POISE_CRUMPLE_THRESHOLD && bIsCrumpled)
    {
        bIsCrumpled = false;
    }

    // Seamless Transition: Blend the crumple weight over time to prevent visual snapping
    float TargetCrumpleWeight = bIsCrumpled ? 1.0f : 0.0f;
    CrumpleBlendWeight = FMath::FInterpTo(CrumpleBlendWeight, TargetCrumpleWeight, DeltaSeconds, 5.0f);

    // IK scales inversely with crumple
    float TargetIKWeight = bIsCrumpled ? 0.0f : 1.0f;
    IKBlendWeight = FMath::FInterpTo(IKBlendWeight, TargetIKWeight, DeltaSeconds, 5.0f);
}

void UBannonAnimInstance::RecalculateBlendWeights(float NewPoiseState)
{
    // Called when UPDATE_READY signal fires and Poise interpolates
    AsyncTask(ENamedThreads::GameThread, [this, NewPoiseState]()
    {
        UE_LOG(LogTemp, Log, TEXT("[BannonAnimInstance] IPC UPDATE_READY Triggered: Recalculating IK & Physical Animation blends for new Poise..."));
        ActivePoise = NewPoiseState;
    });
}
