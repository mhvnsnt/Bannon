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
            FVector LiftVector = FVector::ZeroVector;
            FVector ApexTransition = FVector::ZeroVector;
            FVector DownwardSlam = FVector::ZeroVector;
            FVector TorqueImpulse = FVector::ZeroVector;
            
            float TargetMass = PhysicsComp->GetMass();
            const float MAX_BODY_VEL = 3.8f;
            const float DMG_SCALE = 8.0f;
            
            if (MDickieMoveName == TEXT("suplex"))
            {
                LiftVector = FVector(0.f, 0.f, 1800.f) * TargetMass;
                ApexTransition = FVector(-500.f, 0.f, 0.f) * TargetMass;
                DownwardSlam = FVector(0.f, 0.f, -2500.f) * TargetMass;
                TorqueImpulse = FVector(0.f, -400.f, 0.f) * TargetMass; 
            }
            else if (MDickieMoveName == TEXT("powerbomb"))
            {
                LiftVector = FVector(0.f, 0.f, 2200.f) * TargetMass;
                ApexTransition = FVector(200.f, 0.f, 100.f) * TargetMass;
                DownwardSlam = FVector(0.f, 0.f, -3500.f) * TargetMass;
                TorqueImpulse = FVector(0.f, 300.f, 0.f) * TargetMass; 
            }
            else if (MDickieMoveName == TEXT("piledriver"))
            {
                LiftVector = FVector(0.f, 0.f, 1500.f) * TargetMass;
                ApexTransition = FVector(0.f, 0.f, -50.f) * TargetMass;
                DownwardSlam = FVector(0.f, 0.f, -4000.f) * TargetMass;
                TorqueImpulse = FVector(0.f, -100.f, 0.f) * TargetMass; 
            }
            
            FVector TotalImpulse = LiftVector + ApexTransition + DownwardSlam;
            
            // Strict Constant Enforcement
            FVector VelocityVector = TotalImpulse / TargetMass;
            if (VelocityVector.Size() > (MAX_BODY_VEL * 100.0f))
            {
                VelocityVector = VelocityVector.GetSafeNormal() * (MAX_BODY_VEL * 100.0f);
                TotalImpulse = VelocityVector * TargetMass;
            }
            
            PhysicsComp->AddImpulse(TotalImpulse, NAME_None, true);
            PhysicsComp->AddTorqueInRadians(TorqueImpulse, NAME_None, true);
            
            if (TargetCharacter && TargetCharacter->GetMesh())
            {
                TargetCharacter->GetMesh()->SetSimulatePhysics(true);
                TargetCharacter->GetMesh()->WakeAllRigidBodies();
                
                // Poise Engine Trigger (Independent of 10000 MAX_HP)
                float ImpactVelocity = VelocityVector.Size() / 100.0f;
                float PoiseDamage = ImpactVelocity * TargetMass * DMG_SCALE;
                
                if (PoiseDamage > 0.0f)
                {
                    UE_LOG(LogTemp, Warning, TEXT("Bannon Physics: Slam impact triggers independent Poise Engine. Damage: %f. Routing to Crumple State."), PoiseDamage);
                }
            }
        }
    }
}
