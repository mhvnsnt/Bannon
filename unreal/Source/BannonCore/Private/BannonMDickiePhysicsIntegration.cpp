#include "BannonMDickiePhysicsIntegration.h"
#include "BannonMDickieMoves.h"
#include "GameFramework/Actor.h"
#include "Components/PrimitiveComponent.h"

UBannonMDickiePhysicsIntegration::UBannonMDickiePhysicsIntegration()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonMDickiePhysicsIntegration::BindMDickieMoveToChaos(FString MDickieMoveName, AActor* TargetActor)
{
    if (UBannonMDickieMoves::ValidateMoveExistence(MDickieMoveName))
    {
        UPrimitiveComponent* PhysicsComp = Cast<UPrimitiveComponent>(TargetActor->GetRootComponent());
        if (PhysicsComp && PhysicsComp->IsSimulatingPhysics())
        {
            FVector PhysicsImpulse = FVector::ZeroVector;
            FVector TorqueImpulse = FVector::ZeroVector;
            
            if (MDickieMoveName == TEXT("force out of ring"))
            {
                PhysicsImpulse = FVector(1000.f, 0.f, 500.f);
                TorqueImpulse = FVector(0.f, 200.f, 0.f);
            }
            else if (MDickieMoveName == TEXT("irish whip"))
            {
                PhysicsImpulse = FVector(1500.f, 0.f, 0.f);
            }
            else if (MDickieMoveName == TEXT("grappling"))
            {
                PhysicsImpulse = FVector(0.f, 0.f, -100.f);
            }
            
            PhysicsComp->AddImpulse(PhysicsImpulse, NAME_None, true);
            PhysicsComp->AddTorqueInRadians(TorqueImpulse, NAME_None, true);
            
            UE_LOG(LogTemp, Warning, TEXT("Bannon MDickie Integration: Bound move %s to Chaos physics outputs with FVector(%f, %f, %f)."), *MDickieMoveName, PhysicsImpulse.X, PhysicsImpulse.Y, PhysicsImpulse.Z);
        }
    }
    else
    {
        UE_LOG(LogTemp, Error, TEXT("Bannon MDickie Integration: Move %s not found in move catalog."), *MDickieMoveName);
    }
}
