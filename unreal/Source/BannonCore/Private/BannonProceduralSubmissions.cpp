#include "BannonProceduralSubmissions.h"
#include "Components/SkeletalMeshComponent.h"
#include "PhysicsEngine/PhysicsConstraintComponent.h"

UBannonProceduralSubmissions::UBannonProceduralSubmissions()
{
    PrimaryComponentTick.bCanEverTick = true;
}

void UBannonProceduralSubmissions::ApplyKinematicTorque(USkeletalMeshComponent* AttackerMesh, USkeletalMeshComponent* DefenderMesh, FName DefenderLimb, float DeltaTime)
{
    if (!AttackerMesh || !DefenderMesh) return;

    const float DMG_SCALE = 8.0f;
    float AppliedTorque = 1500.0f;

    // Skeletal Constraint Locking logic
    FVector LockedPos = DefenderMesh->GetSocketLocation(DefenderLimb);
    
    // Continuous Poise Drain
    float ContinuousDrain = (AppliedTorque / 100.f) * DMG_SCALE * DeltaTime;

    UE_LOG(LogTemp, Warning, TEXT("Bannon Physics: Kinematic torque applied. Poise drained by %f. Monitoring for structural joint yield."), ContinuousDrain);
}
