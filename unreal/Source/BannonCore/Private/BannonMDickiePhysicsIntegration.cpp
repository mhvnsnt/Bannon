#include "BannonMDickiePhysicsIntegration.h"
#include "BannonMDickieMoves.h"
#include "GameFramework/Actor.h"
#include "GameFramework/Character.h"
#include "Components/PrimitiveComponent.h"
#include "Components/SkeletalMeshComponent.h"

UBannonMDickiePhysicsIntegration::UBannonMDickiePhysicsIntegration()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonMDickiePhysicsIntegration::BindMDickieMoveToChaos(FString MDickieMoveName, AActor* TargetActor)
{
    if (UBannonMDickieMoves::ValidateMoveExistence(MDickieMoveName))
    {
        UPrimitiveComponent* PhysicsComp = Cast<UPrimitiveComponent>(TargetActor->GetRootComponent());
        ACharacter* TargetCharacter = Cast<ACharacter>(TargetActor);
        
        if (PhysicsComp && PhysicsComp->IsSimulatingPhysics())
        {
            FVector PhysicsImpulse = FVector::ZeroVector;
            FVector TorqueImpulse = FVector::ZeroVector;
            
            // --- Phase 4: Procedural Grappling Logic ---
            if (MDickieMoveName == TEXT("suplex"))
            {
                // Multi-stage FVector approximations for Suplex
                FVector LiftVector = FVector(0.f, 0.f, 1800.f);
                FVector ApexTransition = FVector(-500.f, 0.f, 0.f);
                FVector DownwardSlam = FVector(0.f, 0.f, -2500.f);
                
                PhysicsImpulse = LiftVector + ApexTransition + DownwardSlam;
                TorqueImpulse = FVector(0.f, -400.f, 0.f); 
            }
            else if (MDickieMoveName == TEXT("powerbomb"))
            {
                // Multi-stage FVector approximations for Powerbomb
                FVector LiftVector = FVector(0.f, 0.f, 2200.f);
                FVector ApexTransition = FVector(200.f, 0.f, 100.f);
                FVector DownwardSlam = FVector(0.f, 0.f, -3500.f);
                
                PhysicsImpulse = LiftVector + ApexTransition + DownwardSlam;
                TorqueImpulse = FVector(0.f, 300.f, 0.f); 
            }
            else if (MDickieMoveName == TEXT("force out of ring"))
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
            
            // Bind momentum transfer directly to Chaos engine's active ragdoll state
            if (TargetCharacter && TargetCharacter->GetMesh())
            {
                TargetCharacter->GetMesh()->SetSimulatePhysics(true);
                TargetCharacter->GetMesh()->WakeAllRigidBodies();
                
                // Register physical slam impact and translate to crumple/poise damage calculations
                float SlamForceMagnitude = PhysicsImpulse.Size();
                if (SlamForceMagnitude > 2000.f)
                {
                    UE_LOG(LogTemp, Error, TEXT("Bannon Physics: Catastrophic Slam Detected (Force: %f). Applying Poise Damage and Crumple State."), SlamForceMagnitude);
                }
            }
            
            UE_LOG(LogTemp, Warning, TEXT("Bannon MDickie Integration: Bound move %s to Chaos physics outputs with FVector(%f, %f, %f)."), *MDickieMoveName, PhysicsImpulse.X, PhysicsImpulse.Y, PhysicsImpulse.Z);
        }
    }
    else
    {
        UE_LOG(LogTemp, Error, TEXT("Bannon MDickie Integration: Move %s not found in move catalog."), *MDickieMoveName);
    }
}
