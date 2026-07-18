#include "BannonMDickiePhysicsIntegration.h"
#include "BannonMDickieMoves.h"
#include "GameFramework/Actor.h"

UBannonMDickiePhysicsIntegration::UBannonMDickiePhysicsIntegration()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonMDickiePhysicsIntegration::BindMDickieMoveToChaos(FString MDickieMoveName, AActor* TargetActor)
{
    if (UBannonMDickieMoves::ValidateMoveExistence(MDickieMoveName))
    {
        UE_LOG(LogTemp, Warning, TEXT("Bannon MDickie Integration: Binding move %s to Chaos physics outputs for active ragdoll interpolation."), *MDickieMoveName);
    }
    else
    {
        UE_LOG(LogTemp, Error, TEXT("Bannon MDickie Integration: Move %s not found in move catalog."), *MDickieMoveName);
    }
}
